"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast-provider";

const typeOptions = [
  { value: "VACATION", label: "休暇" },
  { value: "PERSONAL", label: "私用" },
  { value: "SICK", label: "病欠" }
];

export default function RequestForm() {
  const [form, setForm] = useState({
    startDate: "",
    endDate: "",
    type: "VACATION",
    weight: 10,
    reason: ""
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { notify } = useToast();

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: name === "weight" ? Number(value) : value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    const response = await fetch("/api/timeoff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      notify({ title: data.error || "申請に失敗しました", variant: "destructive" });
      return;
    }
    notify({ title: "申請を受け付けました" });
    setForm({ startDate: "", endDate: "", type: "VACATION", weight: 10, reason: "" });
    router.refresh();
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} aria-label="希望休申請フォーム">
      <div className="grid gap-2">
        <Label htmlFor="startDate">開始日</Label>
        <Input id="startDate" name="startDate" type="date" required value={form.startDate} onChange={handleChange} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="endDate">終了日</Label>
        <Input id="endDate" name="endDate" type="date" required value={form.endDate} onChange={handleChange} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="type">種類</Label>
        <Select id="type" name="type" value={form.type} onChange={handleChange}>
          {typeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="weight">希望の強さ ({form.weight})</Label>
        <Input
          id="weight"
          name="weight"
          type="range"
          min={1}
          max={10}
          value={form.weight}
          onChange={handleChange}
          aria-valuemin={1}
          aria-valuemax={10}
          aria-valuenow={form.weight}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="reason">理由（任意）</Label>
        <Textarea id="reason" name="reason" value={form.reason} onChange={handleChange} placeholder="任意で記入してください" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "送信中..." : "申請する"}
      </Button>
    </form>
  );
}
