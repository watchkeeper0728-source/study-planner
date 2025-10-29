import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureStudyCalendar } from "@/lib/gcal";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const calendarId = await ensureStudyCalendar(user);

    return NextResponse.json({ 
      success: true, 
      calendarId,
      message: "Study Plannerカレンダーが作成されました" 
    });
  } catch (error) {
    console.error("カレンダー同期エラー:", error);
    return NextResponse.json(
      { error: "カレンダーの作成に失敗しました" },
      { status: 500 }
    );
  }
}





