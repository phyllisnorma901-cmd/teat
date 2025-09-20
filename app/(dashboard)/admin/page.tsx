import { redirect } from "next/navigation";
import { TimeOffRequestStatus } from "@prisma/client";
import { startOfWeek, endOfWeek, eachDayOfInterval, isWithinInterval } from "date-fns";
import { getCurrentUser } from "@/lib/auth";
import { getAdminTimeOffRequests } from "@/lib/timeoff-service";
import AdminPendingList from "./pending-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toISODateString } from "@/lib/date";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  if (user.role !== "ADMIN") {
    redirect("/request");
  }
  const pending = await getAdminTimeOffRequests(TimeOffRequestStatus.PENDING);
  const all = await getAdminTimeOffRequests();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const employees = Array.from(new Map(all.map((item) => [item.employeeId, item.employee])).values());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>未承認の申請</CardTitle>
        </CardHeader>
        <CardContent>
          <AdminPendingList requests={pending} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>今週の状況</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[700px] table-fixed border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-32 border-b p-2 text-left">従業員</th>
                {days.map((day) => (
                  <th key={day.toISOString()} className="border-b p-2 text-left">
                    {`${day.getMonth() + 1}/${day.getDate()}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b last:border-0">
                  <td className="p-2 font-medium">{employee.name}</td>
                  {days.map((day) => {
                    const request = all.find(
                      (item) =>
                        item.employeeId === employee.id &&
                        isWithinInterval(day, { start: item.startDate, end: item.endDate })
                    );
                    if (!request) {
                      return <td key={`${employee.id}-${day.toISOString()}`} className="p-2" />;
                    }
                    return (
                      <td key={`${employee.id}-${day.toISOString()}`} className="p-2">
                        <Badge variant={badgeVariant(request.status)}>{
                          request.status === TimeOffRequestStatus.APPROVED ? "承認" : "審査中"
                        }</Badge>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>承認済み一覧（最新）</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">従業員</th>
                  <th className="p-2">期間</th>
                  <th className="p-2">種類</th>
                  <th className="p-2">重み</th>
                  <th className="p-2">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {all.map((request) => (
                  <tr key={request.id} className="border-b last:border-0">
                    <td className="p-2">{request.employee.name}</td>
                    <td className="p-2">
                      {toISODateString(request.startDate)} ~ {toISODateString(request.endDate)}
                    </td>
                    <td className="p-2">{translateType(request.type)}</td>
                    <td className="p-2">{request.weight}</td>
                    <td className="p-2">
                      <Badge variant={badgeVariant(request.status)}>{translateStatus(request.status)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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

function badgeVariant(status: string) {
  switch (status) {
    case "APPROVED":
      return "success";
    case "REJECTED":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}
