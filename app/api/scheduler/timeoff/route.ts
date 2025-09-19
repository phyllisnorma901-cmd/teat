import { NextRequest, NextResponse } from "next/server";
import { parseISO } from "date-fns";
import { getCurrentUser, getSchedulerToken } from "@/lib/auth";
import { getSchedulerTimeOff } from "@/lib/timeoff-service";
import { expandDateRange, toISODateString } from "@/lib/date";

function unauthorized() {
  return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const fromParam = request.nextUrl.searchParams.get("from");
  const toParam = request.nextUrl.searchParams.get("to");
  if (!fromParam || !toParam) {
    return NextResponse.json({ error: "from/to パラメータが必要です" }, { status: 400 });
  }
  const fromDate = parseISO(fromParam);
  const toDate = parseISO(toParam);
  if (Number.isNaN(fromDate.valueOf()) || Number.isNaN(toDate.valueOf())) {
    return NextResponse.json({ error: "日付形式が不正です" }, { status: 400 });
  }
  if (toDate < fromDate) {
    return NextResponse.json({ error: "終了日は開始日以降にしてください" }, { status: 400 });
  }

  const token = getSchedulerToken(request);
  const expectedToken = process.env.SCHEDULER_API_TOKEN;
  const user = await getCurrentUser(request);
  if (!user && (!token || token !== expectedToken)) {
    return unauthorized();
  }
  if (user && user.role !== "ADMIN" && (!token || token !== expectedToken)) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }
  const items = await getSchedulerTimeOff(fromDate, toDate);
  const payload = items.map((item) => ({
    employeeId: item.employeeId,
    startDate: toISODateString(item.startDate),
    endDate: toISODateString(item.endDate),
    days: expandDateRange(item.startDate, item.endDate),
    weight: item.weight,
    type: item.type
  }));
  return NextResponse.json(payload);
}
