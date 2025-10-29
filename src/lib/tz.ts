import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";

export function toTokyoTime(date: Date | string): Date {
  if (typeof date === "string") {
    return parseISO(date);
  }
  return date;
}

export function formatTokyoDate(date: Date | string): string {
  return format(toTokyoTime(date), "yyyy-MM-dd", { locale: ja });
}

export function formatTokyoDateTime(date: Date | string): string {
  return format(toTokyoTime(date), "yyyy-MM-dd HH:mm", { locale: ja });
}

export function formatTokyoTime(date: Date | string): string {
  return format(toTokyoTime(date), "HH:mm", { locale: ja });
}