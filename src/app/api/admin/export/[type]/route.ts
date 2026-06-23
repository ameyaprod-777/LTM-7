import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminApi } from "@/lib/api-auth";
import { format } from "date-fns";

function csvEscape(value: string | number | null | undefined) {
  const s = String(value ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [
    headers.join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  return lines.join("\n");
}

export async function GET(
  _req: Request,
  { params }: { params: { type: string } }
) {
  const auth = await requireSuperAdminApi();
  if ("error" in auth) return auth.error;

  const type = params.type;
  let csv = "";
  let filename = "export.csv";

  if (type === "members") {
    const users = await prisma.user.findMany({
      where: { role: { in: ["MEMBER", "MODERATOR", "ADMIN"] } },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv(
      ["id", "email", "name", "role", "status", "city", "memberSince", "createdAt"],
      users.map((u) => [
        u.id,
        u.email,
        u.name,
        u.role,
        u.status,
        u.city,
        u.memberSince ? format(u.memberSince, "yyyy-MM-dd") : null,
        format(u.createdAt, "yyyy-MM-dd"),
      ])
    );
    filename = "membres.csv";
  } else if (type === "applications") {
    const apps = await prisma.membershipApplication.findMany({
      include: { user: { select: { email: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    csv = toCsv(
      ["id", "email", "name", "status", "createdAt", "reviewedAt"],
      apps.map((a) => [
        a.id,
        a.user.email,
        a.user.name,
        a.status,
        format(a.createdAt, "yyyy-MM-dd"),
        a.reviewedAt ? format(a.reviewedAt, "yyyy-MM-dd") : null,
      ])
    );
    filename = "candidatures.csv";
  } else if (type === "bookings") {
    const bookings = await prisma.booking.findMany({
      include: {
        listing: { select: { title: true } },
        renter: { select: { email: true } },
        lister: { select: { email: true } },
        payment: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });
    csv = toCsv(
      [
        "id",
        "listing",
        "renter",
        "lister",
        "status",
        "payment",
        "totalAmount",
        "commissionFee",
        "startDate",
        "createdAt",
      ],
      bookings.map((b) => [
        b.id,
        b.listing.title,
        b.renter.email,
        b.lister.email,
        b.status,
        b.payment?.status ?? null,
        (b.totalAmount / 100).toFixed(2),
        (b.commissionFee / 100).toFixed(2),
        format(b.startDate, "yyyy-MM-dd"),
        format(b.createdAt, "yyyy-MM-dd"),
      ])
    );
    filename = "reservations.csv";
  } else {
    return NextResponse.json({ error: "Type d'export inconnu" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
