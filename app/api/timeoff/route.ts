import { NextRequest, NextResponse } from "next/server";
import { createTimeOffRequest, getMyTimeOffRequests } from "@/lib/timeoff-service";
import { getCurrentUser } from "@/lib/auth";

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  switch (message) {
    case "UNAUTHORIZED":
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    case "INVALID_DATE":
      return NextResponse.json({ error: "日付の形式が正しくありません" }, { status: 400 });
    case "END_BEFORE_START":
      return NextResponse.json({ error: "終了日は開始日以降を指定してください" }, { status: 400 });
    case "RANGE_TOO_LONG":
      return NextResponse.json({ error: "期間は30日以内で入力してください" }, { status: 400 });
    case "OVERLAPPING_REQUEST":
      return NextResponse.json({ error: "既に同じ期間の申請があります" }, { status: 409 });
    case "DEADLINE_PASSED":
      return NextResponse.json({ error: "受付締切を過ぎています" }, { status: 400 });
    default:
      return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    const body = await request.json();
    const result = await createTimeOffRequest(user.id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    const mine = request.nextUrl.searchParams.get("mine");
    if (mine === "true") {
      const results = await getMyTimeOffRequests(user.id);
      return NextResponse.json(results);
    }
    return NextResponse.json({ error: "不正なクエリです" }, { status: 400 });
  } catch (error) {
    return handleError(error);
  }
}
