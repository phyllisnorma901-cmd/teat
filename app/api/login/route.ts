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
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    // ← 失敗時も必ずJSONを返す
    return NextResponse.json({ error: err?.message || "login failed" }, { status: 400 });
  }
}
