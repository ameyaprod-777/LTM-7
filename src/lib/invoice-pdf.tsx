/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import {
  Document as PdfDocument,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

Font.registerHyphenationCallback((w) => [w]);

const ORANGE = "#c45c26";
const DARK = "#1a1a1a";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const s = StyleSheet.create({
  page: { fontFamily: "Helvetica", fontSize: 10, color: DARK, padding: 48 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ORANGE },
  brandSub: { fontSize: 9, color: MUTED, marginTop: 2 },
  invoiceMeta: { alignItems: "flex-end" },
  invoiceTitle: { fontSize: 16, fontFamily: "Helvetica-Bold", color: DARK },
  invoiceRef: { fontSize: 9, color: MUTED, marginTop: 4 },
  invoiceDate: { fontSize: 9, color: MUTED, marginTop: 2 },
  parties: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 28,
  },
  partyBlock: { flex: 1 },
  partyLabel: {
    fontSize: 8,
    color: MUTED,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  partyName: { fontFamily: "Helvetica-Bold", fontSize: 11, marginBottom: 2 },
  partyDetail: { color: MUTED, fontSize: 9, lineHeight: 1.5 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "6 8",
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 8",
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  colDesc: { flex: 1 },
  colAmt: { width: 90, textAlign: "right" },
  colLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: MUTED },
  totals: { marginTop: 12, alignItems: "flex-end" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 3,
  },
  totalLabel: { color: MUTED },
  totalValue: { fontFamily: "Helvetica-Bold" },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 220,
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: DARK,
    marginTop: 4,
  },
  grandLabel: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  grandValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: ORANGE },
  footer: {
    position: "absolute",
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 10,
    fontSize: 8,
    color: MUTED,
    textAlign: "center",
  },
  badge: {
    backgroundColor: "#dcfce7",
    color: "#166534",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    padding: "3 8",
    borderRadius: 4,
    alignSelf: "flex-start",
  },
});

export type InvoiceData = {
  invoiceNumber: string;
  issuedAt: Date;
  booking: {
    id: string;
    startDate: Date;
    endDate: Date;
    listingTitle: string;
    rentalFee: number;
    deliveryFee: number;
    commissionFee: number;
    totalAmount: number;
    cancellationPolicy: string;
  };
  renter: { name: string; email: string; city?: string | null };
  lister: { name: string; email: string; city?: string | null };
  platform: {
    name: string;
    email: string;
    address: string;
    siret?: string | null;
  };
};

function cents(n: number) {
  return (n / 100).toFixed(2).replace(".", ",") + " €";
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function InvoiceDoc({ data }: { data: InvoiceData }) {
  const { booking, renter, lister, platform } = data;
  const days = Math.max(
    1,
    Math.round(
      (booking.endDate.getTime() - booking.startDate.getTime()) /
        86400000
    ) + 1
  );

  return (
    <PdfDocument>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brand}>{platform.name}</Text>
            <Text style={s.brandSub}>Location de matériel audiovisuel P2P</Text>
          </View>
          <View style={s.invoiceMeta}>
            <Text style={s.invoiceTitle}>FACTURE</Text>
            <Text style={s.invoiceRef}>N° {data.invoiceNumber}</Text>
            <Text style={s.invoiceDate}>Émise le {fmtDate(data.issuedAt)}</Text>
            <View style={{ marginTop: 6 }}>
              <Text style={s.badge}>✓ Paiement confirmé</Text>
            </View>
          </View>
        </View>

        {/* Parties */}
        <View style={s.parties}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Plateforme</Text>
            <Text style={s.partyName}>{platform.name}</Text>
            <Text style={s.partyDetail}>{platform.email}</Text>
            <Text style={s.partyDetail}>{platform.address}</Text>
            {platform.siret && (
              <Text style={s.partyDetail}>SIRET : {platform.siret}</Text>
            )}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Locataire</Text>
            <Text style={s.partyName}>{renter.name}</Text>
            <Text style={s.partyDetail}>{renter.email}</Text>
            {renter.city && <Text style={s.partyDetail}>{renter.city}</Text>}
          </View>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Loueur</Text>
            <Text style={s.partyName}>{lister.name}</Text>
            <Text style={s.partyDetail}>{lister.email}</Text>
            {lister.city && <Text style={s.partyDetail}>{lister.city}</Text>}
          </View>
        </View>

        {/* Table */}
        <View style={s.tableHeader}>
          <Text style={[s.colDesc, s.colLabel]}>Description</Text>
          <Text style={[s.colAmt, s.colLabel]}>Montant HT</Text>
        </View>

        <View style={s.tableRow}>
          <View style={s.colDesc}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>
              {booking.listingTitle}
            </Text>
            <Text style={{ color: MUTED, marginTop: 2 }}>
              {fmtDate(booking.startDate)} → {fmtDate(booking.endDate)} ·{" "}
              {days} jour{days > 1 ? "s" : ""}
            </Text>
          </View>
          <Text style={s.colAmt}>{cents(booking.rentalFee)}</Text>
        </View>

        {booking.deliveryFee > 0 && (
          <View style={s.tableRow}>
            <Text style={s.colDesc}>Frais de livraison</Text>
            <Text style={s.colAmt}>{cents(booking.deliveryFee)}</Text>
          </View>
        )}

        <View style={s.tableRow}>
          <View style={s.colDesc}>
            <Text>Commission de service LoueTonMatos</Text>
            <Text style={{ color: MUTED, marginTop: 2 }}>
              Intermédiation, assurance plateforme, support
            </Text>
          </View>
          <Text style={s.colAmt}>{cents(booking.commissionFee)}</Text>
        </View>

        {/* Totals */}
        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Sous-total HT</Text>
            <Text style={s.totalValue}>{cents(booking.totalAmount)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>TVA (0 % — non assujetti)</Text>
            <Text style={s.totalValue}>0,00 €</Text>
          </View>
          <View style={s.grandRow}>
            <Text style={s.grandLabel}>Total TTC</Text>
            <Text style={s.grandValue}>{cents(booking.totalAmount)}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text>
            {platform.name} · {platform.address} · {platform.email}
            {platform.siret ? ` · SIRET ${platform.siret}` : ""}
          </Text>
          <Text style={{ marginTop: 3 }}>
            Réservation #{booking.id} · Politique d&apos;annulation :{" "}
            {booking.cancellationPolicy} · Document généré automatiquement
          </Text>
        </View>
      </Page>
    </PdfDocument>
  );
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  return renderToBuffer(<InvoiceDoc data={data} />);
}

export function buildInvoiceNumber(bookingId: string, issuedAt: Date): string {
  const yyyymm = issuedAt
    .toISOString()
    .slice(0, 7)
    .replace("-", "");
  const suffix = bookingId.slice(-6).toUpperCase();
  return `LTM-${yyyymm}-${suffix}`;
}
