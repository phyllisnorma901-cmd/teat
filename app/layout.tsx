import "./globals.css";
import { ReactNode } from "react";
import { ToastProvider } from "@/components/ui/toast-provider";

export const metadata = {
  title: "希望休提出アプリ",
  description: "従業員の希望休管理MVP"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-background text-foreground">
        <ToastProvider>
          <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-6">
            <header className="mb-6">
              <h1 className="text-2xl font-bold">希望休提出アプリ</h1>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="mt-8 text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} 希望休提出アプリ
            </footer>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
