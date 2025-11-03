import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todoSchema } from "@/lib/validators";

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
    const validatedData = todoSchema.partial().parse(body);

    const resolvedParams = await params;
    const todo = await prisma.todo.update({
      where: {
        id: resolvedParams.id,
        userId: session.id,
      },
      data: validatedData,
    });

    return NextResponse.json(todo);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.message },
        { status: 400 }
      );
    }
    
    console.error("ToDo更新エラー:", error);
    return NextResponse.json(
      { error: "ToDoの更新に失敗しました" },
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
    await prisma.todo.delete({
      where: {
        id: resolvedParams.id,
        userId: session.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ToDo削除エラー:", error);
    return NextResponse.json(
      { error: "ToDoの削除に失敗しました" },
      { status: 500 }
    );
  }
}
