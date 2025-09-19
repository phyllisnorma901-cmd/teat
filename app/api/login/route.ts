import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }
  const session = await createSession(parsed.data.email);
  if (!session) {
    return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }
  return NextResponse.json({ message: "ログインしました", user: session });
}
