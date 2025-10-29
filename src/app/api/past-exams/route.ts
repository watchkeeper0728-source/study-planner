import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pastExamSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const pastExams = await prisma.pastExam.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { schoolName: "asc" },
        { year: "desc" },
        { examNumber: "desc" },
      ],
    });

    return NextResponse.json(pastExams);
  } catch (error) {
    console.error("PastExam取得エラー:", error);
    return NextResponse.json(
      { error: "PastExamの取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = pastExamSchema.parse(body);

    const pastExam = await prisma.pastExam.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(pastExam, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.message },
        { status: 400 }
      );
    }
    
    console.error("PastExam作成エラー:", error);
    return NextResponse.json(
      { error: "PastExamの作成に失敗しました" },
      { status: 500 }
    );
  }
}

