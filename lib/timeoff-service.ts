import { TimeOffRequestStatus, TimeOffType } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { assertDateRange } from "./date";

const createSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  type: z.nativeEnum(TimeOffType),
  reason: z.string().max(500).optional(),
  weight: z.number().int().min(1).max(10).optional()
});

const updateSchema = z.object({
  status: z.nativeEnum(TimeOffRequestStatus),
  weight: z.number().int().min(1).max(10).optional()
});

function ensureDeadline() {
  const weekdayEnv = process.env.REQUEST_DEADLINE_WEEKDAY;
  const hourEnv = process.env.REQUEST_DEADLINE_HOUR;
  if (!weekdayEnv || !hourEnv) {
    return;
  }
  const weekday = Number(weekdayEnv);
  const hour = Number(hourEnv);
  if (Number.isNaN(weekday) || Number.isNaN(hour)) {
    return;
  }
  const now = new Date();
  if (now.getDay() > weekday || (now.getDay() === weekday && now.getHours() >= hour)) {
    throw new Error("DEADLINE_PASSED");
  }
}

export async function createTimeOffRequest(employeeId: string, input: z.infer<typeof createSchema>) {
  const { startDate, endDate, type, reason, weight } = createSchema.parse(input);
  const { startDate: start, endDate: end } = assertDateRange(startDate, endDate);
  ensureDeadline();
  const overlapping = await prisma.timeOffRequest.findFirst({
    where: {
      employeeId,
      status: { in: [TimeOffRequestStatus.PENDING, TimeOffRequestStatus.APPROVED] },
      AND: [{ startDate: { lte: end } }, { endDate: { gte: start } }]
    }
  });
  if (overlapping) {
    throw new Error("OVERLAPPING_REQUEST");
  }
  return prisma.timeOffRequest.create({
    data: {
      employeeId,
      startDate: start,
      endDate: end,
      type,
      reason,
      weight: weight ?? 10
    }
  });
}

export async function getMyTimeOffRequests(employeeId: string) {
  return prisma.timeOffRequest.findMany({
    where: { employeeId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getAdminTimeOffRequests(status?: TimeOffRequestStatus) {
  return prisma.timeOffRequest.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "asc" },
    include: { employee: true }
  });
}

export async function updateTimeOffStatus(
  id: string,
  data: z.infer<typeof updateSchema>
) {
  const parsed = updateSchema.parse(data);
  const existing = await prisma.timeOffRequest.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("NOT_FOUND");
  }
  return prisma.timeOffRequest.update({
    where: { id },
    data: { status: parsed.status, weight: parsed.weight ?? existing.weight }
  });
}

export async function getSchedulerTimeOff(from: Date, to: Date) {
  return prisma.timeOffRequest.findMany({
    where: {
      status: TimeOffRequestStatus.APPROVED,
      startDate: { lte: to },
      endDate: { gte: from }
    },
    include: { employee: true }
  });
}
