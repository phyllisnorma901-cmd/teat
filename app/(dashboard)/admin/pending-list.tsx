"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast-provider";
import { toISODateString } from "@/lib/date";

type PendingRequest = {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    name: string;
    email: string;
  };
  startDate: string | Date;
  endDate: string | Date;
  type: string;
  weight: number;
  reason: string | null;
};

interface Props {
  requests: PendingRequest[];
}

export default function AdminPendingList({ requests }: Props) {
  const [items, setItems] = useState(requests);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { notify } = useToast();

  const handleAction = async (id: string, status: "APPROVED" | "REJECTED") => {
    setLoadingId(id);
    const response = await fetch(`/api/admin/timeoff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    setLoadingId(null);
    if (!response.ok) {
      notify({ title: data.error || "更新に失敗しました", variant: "destructive" });
      return;
    }
    notify({ title: status === "APPROVED" ? "承認しました" : "却下しました" });
    setItems((current) => current.filter((item) => item.id !== id));
  };

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">未承認の申請はありません。</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">従業員</th>
            <th className="p-2">期間</th>
            <th className="p-2">種類</th>
            <th className="p-2">重み</th>
            <th className="p-2">理由</th>
            <th className="p-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b last:border-0">
              <td className="p-2">
                <div className="flex flex-col">
                  <span className="font-medium">{item.employee.name}</span>
                  <span className="text-xs text-muted-foreground">{item.employee.email}</span>
                </div>
              </td>
              <td className="p-2">
                {toISODateString(new Date(item.startDate))} ~ {toISODateString(new Date(item.endDate))}
              </td>
              <td className="p-2">
                <Badge variant="secondary">{translateType(item.type)}</Badge>
              </td>
              <td className="p-2">{item.weight}</td>
              <td className="p-2">{item.reason || "-"}</td>
              <td className="p-2">
                <div className="flex gap-2">
                  <Button type="button" onClick={() => handleAction(item.id, "APPROVED")} disabled={loadingId === item.id}>
                    承認
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleAction(item.id, "REJECTED")}
                    disabled={loadingId === item.id}
                  >
                    却下
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function translateType(type: string) {
  switch (type) {
    case "VACATION":
      return "休暇";
    case "PERSONAL":
      return "私用";
    case "SICK":
      return "病欠";
    default:
      return type;
  }
}
