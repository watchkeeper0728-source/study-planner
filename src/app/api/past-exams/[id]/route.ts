import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pastExamSchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = pastExamSchema.partial().parse(body);

    const resolvedParams = await params;
    const pastExam = await prisma.pastExam.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!pastExam) {
      return NextResponse.json({ error: "PastExamが見つかりません" }, { status: 404 });
    }

    if (pastExam.userId !== session.user.id) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const updatedPastExam = await prisma.pastExam.update({
      where: { id: resolvedParams.id },
      data: validatedData,
    });

    return NextResponse.json(updatedPastExam);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.message },
        { status: 400 }
      );
    }
    
    console.error("PastExam更新エラー:", error);
    return NextResponse.json(
      { error: "PastExamの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const resolvedParams = await params;
    const pastExam = await prisma.pastExam.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!pastExam) {
      return NextResponse.json({ error: "PastExamが見つかりません" }, { status: 404 });
    }

    if (pastExam.userId !== session.user.id) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    await prisma.pastExam.delete({
      where: { id: resolvedParams.id },
    });

    return NextResponse.json({ message: "削除しました" });
  } catch (error) {
    console.error("PastExam削除エラー:", error);
    return NextResponse.json(
      { error: "PastExamの削除に失敗しました" },
      { status: 500 }
    );
  }
}

