import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getMyTimeOffRequests } from "@/lib/timeoff-service";
import RequestForm from "./request-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toISODateString } from "@/lib/date";

export default async function RequestPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role === "ADMIN") {
    redirect("/admin");
  }
  const requests = await getMyTimeOffRequests(user.id);
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>希望休を提出</CardTitle>
        </CardHeader>
        <CardContent>
          <RequestForm />
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">提出履歴</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだ申請はありません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">提出日</th>
                  <th className="p-2">期間</th>
                  <th className="p-2">種類</th>
                  <th className="p-2">希望の強さ</th>
                  <th className="p-2">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} className="border-b last:border-0">
                    <td className="p-2">{new Date(request.createdAt).toLocaleString("ja-JP")}</td>
                    <td className="p-2">
                      {toISODateString(request.startDate)} ~ {toISODateString(request.endDate)}
                    </td>
                    <td className="p-2">{translateType(request.type)}</td>
                    <td className="p-2">{request.weight}</td>
                    <td className="p-2">
                      <Badge variant={statusVariant(request.status)}>{translateStatus(request.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
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

function translateStatus(status: string) {
  switch (status) {
    case "PENDING":
      return "審査待ち";
    case "APPROVED":
      return "承認済み";
    case "REJECTED":
      return "却下";
    default:
      return status;
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}
