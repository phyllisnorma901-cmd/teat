import { PrismaClient, EmployeeRole, TimeOffRequestStatus, TimeOffType } from "@prisma/client";
import { addDays, startOfWeek } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  await prisma.timeOffRequest.deleteMany();
  await prisma.employee.deleteMany();

  const admin = await prisma.employee.create({
    data: {
      name: "管理者",
      email: "admin@example.com",
      role: EmployeeRole.ADMIN
    }
  });

  const alice = await prisma.employee.create({
    data: { name: "Alice", email: "alice@example.com", role: EmployeeRole.EMPLOYEE }
  });
  const bob = await prisma.employee.create({
    data: { name: "Bob", email: "bob@example.com", role: EmployeeRole.EMPLOYEE }
  });
  const charlie = await prisma.employee.create({
    data: { name: "Charlie", email: "charlie@example.com", role: EmployeeRole.EMPLOYEE }
  });

  const nextWeekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);

  await prisma.timeOffRequest.createMany({
    data: [
      {
        employeeId: alice.id,
        startDate: nextWeekStart,
        endDate: addDays(nextWeekStart, 2),
        type: TimeOffType.VACATION,
        weight: 8,
        status: TimeOffRequestStatus.PENDING,
        reason: "家族旅行"
      },
      {
        employeeId: bob.id,
        startDate: addDays(nextWeekStart, 3),
        endDate: addDays(nextWeekStart, 4),
        type: TimeOffType.PERSONAL,
        weight: 6,
        status: TimeOffRequestStatus.PENDING,
        reason: "私用のため"
      }
    ]
  });

  console.log("Seed data created", { admin: admin.email, employees: [alice.email, bob.email, charlie.email] });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
