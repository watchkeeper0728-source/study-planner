import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { testSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const tests = await prisma.test.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error("Test取得エラー:", error);
    return NextResponse.json(
      { error: "Testの取得に失敗しました" },
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

    // 3件制限チェック
    const existingTests = await prisma.test.count({
      where: { userId: session.user.id },
    });

    if (existingTests >= 3) {
      return NextResponse.json(
        { error: "テストは最大3件まで登録できます" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = testSchema.parse(body);

    const test = await prisma.test.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        date: new Date(validatedData.date),
      },
    });

    return NextResponse.json(test, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.message },
        { status: 400 }
      );
    }
    
    console.error("Test作成エラー:", error);
    return NextResponse.json(
      { error: "Testの作成に失敗しました" },
      { status: 500 }
    );
  }
}





