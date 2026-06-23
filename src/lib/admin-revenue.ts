import { subMonths, startOfMonth, format } from "date-fns";
import { fr } from "date-fns/locale";
import { prisma } from "@/lib/prisma";

export async function getAdminRevenueStats() {
  const [
    commissionAgg,
    serviceCommissionAgg,
    heldPayments,
    heldServicePayments,
    releasedPayments,
    releasedServicePayments,
    completedCount,
  ] = await Promise.all([
    prisma.booking.aggregate({
      where: { status: "COMPLETED" },
      _sum: { commissionFee: true },
      _count: { id: true },
    }),
    prisma.serviceQuotePayment.aggregate({
      where: { status: "RELEASED" },
      _sum: { commissionFee: true },
      _count: { id: true },
    }),
    prisma.payment.findMany({
      where: { status: "HELD" },
      select: { amount: true, booking: { select: { commissionFee: true } } },
    }),
    prisma.serviceQuotePayment.findMany({
      where: { status: "HELD" },
      select: { amount: true, commissionFee: true },
    }),
    prisma.payment.aggregate({
      where: { status: "RELEASED" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.serviceQuotePayment.aggregate({
      where: { status: "RELEASED" },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.booking.count({ where: { status: { in: ["CONFIRMED", "ACTIVE"] } } }),
  ]);

  const heldAmount =
    heldPayments.reduce((s, p) => s + p.amount, 0) +
    heldServicePayments.reduce((s, p) => s + p.amount, 0);
  const heldCommission =
    heldPayments.reduce((s, p) => s + p.booking.commissionFee, 0) +
    heldServicePayments.reduce((s, p) => s + p.commissionFee, 0);

  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
  const recentBookings = await prisma.booking.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: sixMonthsAgo },
    },
    select: { commissionFee: true, completedAt: true },
  });

  const monthlyMap = new Map<string, number>();
  for (let i = 0; i < 6; i++) {
    const d = startOfMonth(subMonths(new Date(), 5 - i));
    monthlyMap.set(format(d, "yyyy-MM"), 0);
  }

  for (const b of recentBookings) {
    if (!b.completedAt) continue;
    const key = format(startOfMonth(b.completedAt), "yyyy-MM");
    if (monthlyMap.has(key)) {
      monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + b.commissionFee);
    }
  }

  const monthlyChart = Array.from(monthlyMap.entries()).map(([key, cents]) => {
    const [y, m] = key.split("-").map(Number);
    const label = format(new Date(y, m - 1, 1), "MMM yy", { locale: fr });
    return { label, cents, euros: cents / 100 };
  });

  const totalCommissionCents =
    (commissionAgg._sum.commissionFee ?? 0) +
    (serviceCommissionAgg._sum.commissionFee ?? 0);

  return {
    totalCommissionCents,
    completedBookings: commissionAgg._count.id,
    completedServiceQuotes: serviceCommissionAgg._count.id,
    heldPaymentsCount: heldPayments.length + heldServicePayments.length,
    heldAmountCents: heldAmount,
    heldCommissionCents: heldCommission,
    releasedVolumeCents:
      (releasedPayments._sum.amount ?? 0) +
      (releasedServicePayments._sum.amount ?? 0),
    releasedPaymentsCount:
      releasedPayments._count.id + releasedServicePayments._count.id,
    activeBookings: completedCount,
    monthlyChart,
  };
}
