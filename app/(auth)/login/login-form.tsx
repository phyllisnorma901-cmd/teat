"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast-provider";

interface LoginFormProps {
  user: { email: string; role: string } | null;
}

export default function LoginForm({ user }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { notify } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // 空ボディでも落ちないように安全にパース
      let data: any = null;
      const text = await res.text();
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          // サーバがJSON以外を返しても無視
        }
      }

      if (!res.ok) {
        notify({
          title: (data && (data.error || data.message)) || "ログインに失敗しました",
          variant: "destructive",
        });
        return;
      }

      notify({ title: "ログインしました" });
      setEmail("");

      // 役割が返っていれば適切な画面へ。なければ従業員画面にフォールバック
      const role: string | undefined =
        data?.role || data?.user?.role || (email === "admin@example.com" ? "ADMIN" : undefined);

      if (role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/request");
      }
    } catch (err: any) {
      notify({
        title: "通信エラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      // サーバ側の状態を反映
      router.refresh();
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
      notify({ title: "ログアウトしました" });
    } catch {
      notify({ title: "ログアウトに失敗しました", variant: "destructive" });
    } finally {
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="ログインフォーム">
      <div className="space-y-2">
        <Label htmlFor="email">メールアドレス</Label>
        <Input
          id="email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="alice@example.com"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "送信中..." : "ログインリンクを送る"}
        </Button>
        {user ? (
          <Button type="button" variant="outline" onClick={handleLogout}>
            ログアウト
          </Button>
        ) : null}
      </div>
    </form>
  );
}
