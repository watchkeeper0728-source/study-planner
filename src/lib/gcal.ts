import { google } from "googleapis";
import { prisma } from "./prisma";
import { User } from "@prisma/client";

export async function getGoogleCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: "google",
    },
  });

  if (!account?.refresh_token) {
    throw new Error("Google認証情報が見つかりません");
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + "/api/auth/callback/google"
  );

  oauth2Client.setCredentials({
    refresh_token: account.refresh_token,
  });

  return google.calendar({ version: "v3", auth: oauth2Client });
}

export async function ensureStudyCalendar(user: User) {
  if (user.gcalId) {
    return user.gcalId;
  }

  const calendar = await getGoogleCalendarClient(user.id);
  
  try {
    const response = await calendar.calendars.insert({
      requestBody: {
        summary: "Study Planner",
        description: "中学受験学習予定・記録アプリ専用カレンダー",
        timeZone: "Asia/Tokyo",
      },
    });

    const calendarId = response.data.id!;
    
    await prisma.user.update({
      where: { id: user.id },
      data: { gcalId: calendarId },
    });

    return calendarId;
  } catch (error) {
    console.error("カレンダー作成エラー:", error);
    throw new Error("Googleカレンダーの作成に失敗しました");
  }
}

export async function upsertEvent(plan: {
  id: string;
  title: string;
  start: Date;
  end: Date;
  subject: string;
  gcalEventId?: string | null;
}, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user?.gcalId) {
    throw new Error("カレンダーIDが見つかりません");
  }

  const calendar = await getGoogleCalendarClient(user.id);
  const subjectEmoji = getSubjectEmoji(plan.subject);
  const eventTitle = `${subjectEmoji} ${plan.title}`;

  const event = {
    summary: eventTitle,
    start: {
      dateTime: plan.start.toISOString(),
      timeZone: "Asia/Tokyo",
    },
    end: {
      dateTime: plan.end.toISOString(),
      timeZone: "Asia/Tokyo",
    },
  };

  try {
    let response;
    if (plan.gcalEventId) {
      response = await calendar.events.update({
        calendarId: user.gcalId,
        eventId: plan.gcalEventId,
        requestBody: event,
      });
    } else {
      response = await calendar.events.insert({
        calendarId: user.gcalId,
        requestBody: event,
      });
    }

    return response.data.id;
  } catch (error) {
    console.error("イベント同期エラー:", error);
    throw new Error("Googleカレンダーへの同期に失敗しました");
  }
}

export async function deleteEvent(gcalEventId: string, userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user?.gcalId) {
    return;
  }

  const calendar = await getGoogleCalendarClient(userId);

  try {
    await calendar.events.delete({
      calendarId: user.gcalId,
      eventId: gcalEventId,
    });
  } catch (error) {
    console.error("イベント削除エラー:", error);
    // 削除エラーは無視（既に削除されている可能性）
  }
}

function getSubjectEmoji(subject: string): string {
  switch (subject) {
    case "MATH":
      return "🔢";
    case "JAPANESE":
      return "📚";
    case "SCIENCE":
      return "🔬";
    case "SOCIAL":
      return "🌍";
    default:
      return "📝";
  }
}