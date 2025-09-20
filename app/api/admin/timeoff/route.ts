import { NextRequest, NextResponse } from "next/server";
import { TimeOffRequestStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { getAdminTimeOffRequests } from "@/lib/timeoff-service";

function handleError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  switch (message) {
    case "UNAUTHORIZED":
      return NextResponse.json({ error: "ログインが必要です" }, { status: 401 });
    case "FORBIDDEN":
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    default:
      return NextResponse.json({ error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      throw new Error("UNAUTHORIZED");
    }
    if (user.role !== "ADMIN") {
      throw new Error("FORBIDDEN");
    }
    const statusParam = request.nextUrl.searchParams.get("status") as TimeOffRequestStatus | null;
    const status = statusParam && Object.values(TimeOffRequestStatus).includes(statusParam)
      ? statusParam
      : undefined;
    const results = await getAdminTimeOffRequests(status ?? TimeOffRequestStatus.PENDING);
    return NextResponse.json(results);
  } catch (error) {
    return handleError(error);
  }
}
