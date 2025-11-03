import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { todoSchema } from "@/lib/validators";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const todos = await prisma.todo.findMany({
      where: { userId: session.id },
      orderBy: [
        { priority: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(todos);
  } catch (error) {
    console.error("ToDo取得エラー:", error);
    return NextResponse.json(
      { error: "ToDoの取得に失敗しました" },
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
    const validatedData = todoSchema.parse(body);

    const todo = await prisma.todo.create({
      data: {
        ...validatedData,
        userId: session.id,
      },
    });

    return NextResponse.json(todo, { status: 201 });
  } catch (error: any) {
    console.error("ToDo作成エラー詳細:", error);
    console.error("エラー型:", error.constructor?.name);
    console.error("エラー詳細:", JSON.stringify(error, null, 2));
    
    // Zodエラーのチェック
    if (error.issues || error.name === "ZodError" || error.constructor?.name === "ZodError") {
      return NextResponse.json(
        { error: "入力データが正しくありません", details: error.issues || error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "ToDoの作成に失敗しました", details: error.message || String(error) },
      { status: 500 }
    );
  }
}

