import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reflectionSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const order = searchParams.get("order") || "desc";
    const subject = searchParams.get("subject");

    const where: any = { userId: session.user.id };
    if (subject) {
      where.subject = subject;
    }

    const reflections = await prisma.reflection.findMany({
      where,
      include: {
        test: true,
      },
      orderBy: { createdAt: order === "asc" ? "asc" : "desc" },
    });

    return NextResponse.json(reflections);
  } catch (error) {
    console.error("Reflection取得エラー:", error);
    return NextResponse.json(
      { error: "Reflectionの取得に失敗しました" },
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
    const validatedData = reflectionSchema.parse(body);

    const reflection = await prisma.reflection.create({
      data: {
        ...validatedData,
        userId: session.user.id,
      },
    });

    return NextResponse.json(reflection, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.message },
        { status: 400 }
      );
    }
    
    console.error("Reflection作成エラー:", error);
    return NextResponse.json(
      { error: "Reflectionの作成に失敗しました" },
      { status: 500 }
    );
  }
}





