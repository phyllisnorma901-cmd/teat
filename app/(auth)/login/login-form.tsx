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
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      notify({ title: data.error || "ログインに失敗しました", variant: "destructive" });
      return;
    }
    notify({ title: "ログインしました" });
    setEmail("");
    router.refresh();
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    notify({ title: "ログアウトしました" });
    router.refresh();
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
