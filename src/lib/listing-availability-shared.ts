import { format, parseISO, startOfDay } from "date-fns";

export function toDateKey(date: Date): string {
  return format(startOfDay(date), "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  return startOfDay(parseISO(key));
}

export function isDateBlocked(
  dateKey: string,
  blocked: string[],
  booked: { start: string; end: string }[]
): boolean {
  if (blocked.includes(dateKey)) return true;
  const d = parseDateKey(dateKey).getTime();
  return booked.some((range) => {
    const start = parseDateKey(range.start).getTime();
    const end = parseDateKey(range.end).getTime();
    return d >= start && d <= end;
  });
}
