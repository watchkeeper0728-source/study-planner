import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planSchema } from "@/lib/validators";
import { upsertEvent, deleteEvent } from "@/lib/gcal";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "from と to パラメータが必要です" },
        { status: 400 }
      );
    }

    const plans = await prisma.plan.findMany({
      where: {
        userId: session.user.id,
        start: {
          gte: new Date(from),
          lte: new Date(to),
        },
      },
      orderBy: { start: "asc" },
    });

    console.log("Retrieved plans count:", plans.length);
    if (plans.length > 0) {
      console.log("First plan subject:", plans[0].subject, typeof plans[0].subject);
    }

    return NextResponse.json(plans);
  } catch (error) {
    console.error("Plan取得エラー:", error);
    return NextResponse.json(
      { error: "Planの取得に失敗しました" },
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
    const validatedData = planSchema.parse(body);

    const plan = await prisma.plan.create({
      data: {
        ...validatedData,
        userId: session.user.id,
        start: new Date(validatedData.start),
        end: new Date(validatedData.end),
        subject: validatedData.subject,
      },
    });
    
    console.log("Created plan:", plan);

    // Googleカレンダーに同期
    try {
      const gcalEventId = await upsertEvent({
        id: plan.id,
        title: plan.title,
        start: plan.start,
        end: plan.end,
        subject: plan.subject,
        gcalEventId: null,
      }, session.user.id);

      await prisma.plan.update({
        where: { id: plan.id },
        data: { gcalEventId },
      });
    } catch (gcalError) {
      console.error("Googleカレンダー同期エラー:", gcalError);
      // エラーでもPlanは作成済みなので続行
    }

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.message },
        { status: 400 }
      );
    }
    
    console.error("Plan作成エラー:", error);
    return NextResponse.json(
      { error: "Planの作成に失敗しました" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    // ユーザーのすべてのPlanを削除
    const plans = await prisma.plan.findMany({
      where: {
        userId: session.user.id,
      },
    });

    // Googleカレンダーから削除
    for (const plan of plans) {
      if (plan.gcalEventId) {
        try {
          await deleteEvent(plan.gcalEventId, session.user.id);
        } catch (gcalError) {
          console.error("Googleカレンダー削除エラー:", gcalError);
        }
      }
    }

    // データベースから削除
    await prisma.plan.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    return NextResponse.json({ message: "すべての予定を削除しました" });
  } catch (error) {
    console.error("Plan一括削除エラー:", error);
    return NextResponse.json(
      { error: "Planの一括削除に失敗しました" },
      { status: 500 }
    );
  }
}
