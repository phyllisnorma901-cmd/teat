import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  return (
    <div className="mx-auto max-w-md space-y-6">
      <h2 className="text-xl font-semibold">メールでログイン</h2>
      <p className="text-sm text-muted-foreground">
        登録済みのメールアドレスを入力するとワンクリックでログインできます（MVPのため即時ログイン）。
      </p>
      <LoginForm user={user} />
      {user ? (
        <div className="space-y-2 text-sm">
          <p>
            ログイン中: <span className="font-medium">{user.email}</span>
          </p>
          <p>
            {user.role === "ADMIN" ? (
              <Link href="/admin" className="text-primary underline">
                管理画面へ進む
              </Link>
            ) : (
              <Link href="/request" className="text-primary underline">
                希望休の提出画面へ進む
              </Link>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
