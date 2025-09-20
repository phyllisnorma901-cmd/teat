import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateTimeOffStatus } from "@/lib/timeoff-service";

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  switch (message) {
    case "UNAUTHORIZED":
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    case "FORBIDDEN":
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    case "NOT_FOUND":
      return NextResponse.json({ error: "申請が見つかりません" }, { status: 404 });
    case "INVALID_DATE":
    case "END_BEFORE_START":
    case "RANGE_TOO_LONG":
      return NextResponse.json({ error: "入力内容を確認してください" }, { status: 400 });
    default:
      return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    if (user.role !== "ADMIN") {
      throw new Error("FORBIDDEN");
    }
    const body = await request.json();
    const result = await updateTimeOffStatus(params.id, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleError(error);
  }
}
