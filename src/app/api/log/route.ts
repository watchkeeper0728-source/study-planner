import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { studyLogSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "day";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "from と to パラメータが必要です" },
        { status: 400 }
      );
    }

    const logs = await prisma.studyLog.findMany({
      where: {
        userId: session.id,
        date: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("StudyLog取得エラー:", error);
    return NextResponse.json(
      { error: "StudyLogの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = studyLogSchema.parse(body);

    const log = await prisma.studyLog.create({
      data: {
        ...validatedData,
        userId: session.id,
        date: new Date(validatedData.date),
      },
    });

    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.message },
        { status: 400 }
      );
    }
    
    console.error("StudyLog作成エラー:", error);
    return NextResponse.json(
      { error: "StudyLogの作成に失敗しました" },
      { status: 500 }
    );
  }
}
