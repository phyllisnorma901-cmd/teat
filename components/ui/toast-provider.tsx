"use client";

import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import { cn } from "./lib/utils";

type Toast = {
  id: number;
  title: string;
  variant?: "default" | "destructive";
};

type ToastContextValue = {
  notify: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((toast: Omit<Toast, "id">) => {
    setToasts((current) => {
      const next = [...current, { ...toast, id: Date.now() }];
      return next.slice(-3);
    });
    setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 3000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-72 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "rounded-md border bg-background p-3 text-sm shadow-lg",
              toast.variant === "destructive" ? "border-destructive text-destructive" : "border-border"
            )}
          >
            {toast.title}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
