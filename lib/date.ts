import { addDays, differenceInCalendarDays, eachDayOfInterval, formatISO, parseISO } from "date-fns";

export function assertDateRange(start: string, end: string) {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  if (Number.isNaN(startDate.valueOf()) || Number.isNaN(endDate.valueOf())) {
    throw new Error("INVALID_DATE");
  }
  if (endDate < startDate) {
    throw new Error("END_BEFORE_START");
  }
  const diff = differenceInCalendarDays(endDate, startDate);
  if (diff > 30) {
    throw new Error("RANGE_TOO_LONG");
  }
  return { startDate, endDate };
}

export function toISODateString(date: Date) {
  return formatISO(date, { representation: "date" });
}

export function expandDateRange(start: Date, end: Date) {
  return eachDayOfInterval({ start, end }).map((day) => toISODateString(day));
}

export function nextWeekRange() {
  const now = new Date();
  const start = addDays(now, 7 - now.getDay());
  const end = addDays(start, 6);
  return { start, end };
}
