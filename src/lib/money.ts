export function formatCents(cents: number, locale = "fr-FR") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

export function eurosToCents(euros: number) {
  return Math.round(euros * 100);
}

export function centsToEuros(cents: number) {
  return cents / 100;
}
