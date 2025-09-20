import { TimeOffRequestStatus, TimeOffType } from "@prisma/client";
import {
  createTimeOffRequest,
  getMyTimeOffRequests,
  updateTimeOffStatus,
  getSchedulerTimeOff,
  getAdminTimeOffRequests
} from "@/lib/timeoff-service";

jest.mock("@/lib/prisma", () => {
  const employees = new Map<string, any>();
  let requests: any[] = [];
  let idCounter = 1;

  function reset() {
    requests = [];
    employees.clear();
    idCounter = 1;
  }

  function matchesAnd(item: any, condition: any) {
    if (condition.startDate?.lte && !(item.startDate <= condition.startDate.lte)) {
      return false;
    }
    if (condition.endDate?.gte && !(item.endDate >= condition.endDate.gte)) {
      return false;
    }
    return true;
  }

  return {
    prisma: {
      employee: {
        findUnique: jest.fn(async ({ where }: any) => {
          if (where.id) {
            return employees.get(where.id) || null;
          }
          if (where.email) {
            return Array.from(employees.values()).find((emp) => emp.email === where.email) || null;
          }
          return null;
        })
      },
      timeOffRequest: {
        findFirst: jest.fn(async ({ where }: any) => {
          return (
            requests.find((item) => {
              if (where.employeeId && item.employeeId !== where.employeeId) return false;
              if (where.status?.in && !where.status.in.includes(item.status)) return false;
              if (where.AND) {
                return where.AND.every((cond: any) => matchesAnd(item, cond));
              }
              return true;
            }) || null
          );
        }),
        create: jest.fn(async ({ data }: any) => {
          const now = new Date();
          const request = {
            id: `req_${idCounter++}`,
            createdAt: now,
            updatedAt: now,
            status: data.status ?? TimeOffRequestStatus.PENDING,
            ...data
          };
          requests.push(request);
          return request;
        }),
        findMany: jest.fn(async ({ where, orderBy, include }: any = {}) => {
          let result = [...requests];
          if (where?.employeeId) {
            result = result.filter((item) => item.employeeId === where.employeeId);
          }
          if (where?.status) {
            if (where.status.in) {
              result = result.filter((item) => where.status.in.includes(item.status));
            } else {
              result = result.filter((item) => item.status === where.status);
            }
          }
          if (where?.startDate?.lte) {
            result = result.filter((item) => item.startDate <= where.startDate.lte);
          }
          if (where?.endDate?.gte) {
            result = result.filter((item) => item.endDate >= where.endDate.gte);
          }
          if (orderBy?.createdAt === "desc") {
            result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          }
          if (include?.employee) {
            result = result.map((item) => ({ ...item, employee: employees.get(item.employeeId) }));
          }
          return result;
        }),
        findUnique: jest.fn(async ({ where }: any) => requests.find((item) => item.id === where.id) || null),
        update: jest.fn(async ({ where, data }: any) => {
          const index = requests.findIndex((item) => item.id === where.id);
          if (index === -1) return null;
          requests[index] = { ...requests[index], ...data, updatedAt: new Date() };
          return requests[index];
        })
      }
    },
    __setEmployees(list: any[]) {
      employees.clear();
      list.forEach((emp) => employees.set(emp.id, emp));
    },
    __reset: reset
  };
});

describe("timeoff-service", () => {
  const prismaModule: any = jest.requireMock("@/lib/prisma");

  beforeEach(() => {
    prismaModule.__reset();
    prismaModule.__setEmployees([
      { id: "emp1", name: "Alice", email: "alice@example.com" },
      { id: "emp2", name: "Bob", email: "bob@example.com" }
    ]);
  });

  it("creates a time off request and lists it for the employee", async () => {
    const request = await createTimeOffRequest("emp1", {
      startDate: "2024-01-10",
      endDate: "2024-01-12",
      type: TimeOffType.VACATION,
      weight: 7
    });
    expect(request.id).toBeDefined();

    const mine = await getMyTimeOffRequests("emp1");
    expect(mine).toHaveLength(1);
    expect(mine[0].weight).toBe(7);
  });

  it("prevents overlapping submissions", async () => {
    await createTimeOffRequest("emp1", {
      startDate: "2024-01-10",
      endDate: "2024-01-12",
      type: TimeOffType.VACATION
    });
    await expect(
      createTimeOffRequest("emp1", {
        startDate: "2024-01-11",
        endDate: "2024-01-13",
        type: TimeOffType.SICK
      })
    ).rejects.toThrow("OVERLAPPING_REQUEST");
  });

  it("allows admin to approve and scheduler to fetch approved requests", async () => {
    const created = await createTimeOffRequest("emp2", {
      startDate: "2024-01-15",
      endDate: "2024-01-16",
      type: TimeOffType.PERSONAL
    });

    const updated = await updateTimeOffStatus(created.id, {
      status: TimeOffRequestStatus.APPROVED,
      weight: 5
    });
    expect(updated?.status).toBe(TimeOffRequestStatus.APPROVED);

    const scheduler = await getSchedulerTimeOff(new Date("2024-01-01"), new Date("2024-01-31"));
    expect(scheduler).toHaveLength(1);
    expect(scheduler[0].employeeId).toBe("emp2");
  });

  it("returns pending requests for admin queue", async () => {
    await createTimeOffRequest("emp1", {
      startDate: "2024-02-01",
      endDate: "2024-02-03",
      type: TimeOffType.VACATION
    });
    const adminList = await getAdminTimeOffRequests(TimeOffRequestStatus.PENDING);
    expect(adminList).toHaveLength(1);
  });
});
