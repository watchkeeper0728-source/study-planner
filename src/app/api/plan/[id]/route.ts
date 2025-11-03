import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planSchema } from "@/lib/validators";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = planSchema.partial().parse(body);

    const resolvedParams = await params;
    const existingPlan = await prisma.plan.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!existingPlan || existingPlan.userId !== session.id) {
      return NextResponse.json({ error: "Planが見つかりません" }, { status: 404 });
    }

    const plan = await prisma.plan.update({
      where: {
        id: resolvedParams.id,
        userId: session.id,
      },
      data: {
        ...validatedData,
        start: validatedData.start ? new Date(validatedData.start) : undefined,
        end: validatedData.end ? new Date(validatedData.end) : undefined,
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.message },
        { status: 400 }
      );
    }
    
    console.error("Plan更新エラー:", error);
    return NextResponse.json(
      { error: "Planの更新に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const resolvedParams = await params;
    const plan = await prisma.plan.findUnique({
      where: { id: resolvedParams.id },
    });

    if (!plan || plan.userId !== session.id) {
      return NextResponse.json({ error: "Planが見つかりません" }, { status: 404 });
    }

    await prisma.plan.delete({
      where: {
        id: resolvedParams.id,
        userId: session.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Plan削除エラー:", error);
    return NextResponse.json(
      { error: "Planの削除に失敗しました" },
      { status: 500 }
    );
  }
}
