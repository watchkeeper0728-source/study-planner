import { format, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ja } from "date-fns/locale";

export function generateTimeBlocks(date: Date) {
  const dayOfWeek = date.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 日曜日または土曜日
  
  if (isWeekend) {
    // 土日: 9:00-18:00
    return [
      {
        start: format(date, "yyyy-MM-dd") + "T09:00:00",
        end: format(date, "yyyy-MM-dd") + "T18:00:00",
        display: "background",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgba(59, 130, 246, 0.2)",
      },
    ];
  } else {
    // 平日: 17:00-21:00
    return [
      {
        start: format(date, "yyyy-MM-dd") + "T17:00:00",
        end: format(date, "yyyy-MM-dd") + "T21:00:00",
        display: "background",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        borderColor: "rgba(59, 130, 246, 0.2)",
      },
    ];
  }
}

export function generateWeekTimeBlocks(startDate: Date) {
  const timeBlocks: any[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    timeBlocks.push(...generateTimeBlocks(date));
  }
  
  return timeBlocks;
}

export function formatDateJapanese(date: Date): string {
  return format(date, "M月d日(E)", { locale: ja });
}

export function formatTimeJapanese(date: Date): string {
  return format(date, "HH:mm");
}