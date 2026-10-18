import { Router } from "express";
import { and, asc, count, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { db } from "../db";
import {
  appointments,
  labTests,
  notifications,
  patientLabResults,
  patients,
  CKD_STAGES,
  type CkdStage,
  type Doctor,
} from "../../shared/schema";
import { requireDoctor } from "../auth";
import { asyncHandler } from "../utils";
import { doctorWithUser, patientWithRelations, serializeAppointment, serializeNotification, serializePatient, publicUserColumns } from "../serializers";
import { DFG_TEST_NAME } from "./lab";

const router = Router();
router.use(requireDoctor);

function sixMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 5, 1);
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/stats", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const doctorPatients = db.select({ id: patients.id }).from(patients).where(eq(patients.doctorId, doctor.id));

  const [stageRows, [appointmentCount], [upcomingCount], [criticalCount], [unreadLabCount], trendRows] = await Promise.all([
    db
      .select({ stage: patients.ckdStage, value: count() })
      .from(patients)
      .where(eq(patients.doctorId, doctor.id))
      .groupBy(patients.ckdStage),
    db.select({ value: count() }).from(appointments).where(eq(appointments.doctorId, doctor.id)),
    db
      .select({ value: count() })
      .from(appointments)
      .where(and(
        eq(appointments.doctorId, doctor.id),
        gte(appointments.appointmentDate, new Date()),
        ne(appointments.doctorStatus, "cancelled"),
      )),
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.doctorId, doctor.id), eq(notifications.severity, "error"), eq(notifications.isRead, false))),
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(
        eq(notifications.doctorId, doctor.id),
        eq(notifications.isRead, false),
        sql`${notifications.labResultId} is not null`,
      )),
    // Moyenne mensuelle du DFG des patients du médecin sur 6 mois
    db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${patientLabResults.resultDate}), 'YYYY-MM')`,
        value: sql<number>`round(avg(${patientLabResults.resultValue}))::int`,
      })
      .from(patientLabResults)
      .innerJoin(labTests, eq(labTests.id, patientLabResults.labTestId))
      .where(and(
        eq(labTests.testName, DFG_TEST_NAME),
        inArray(patientLabResults.patientId, doctorPatients),
        gte(patientLabResults.resultDate, sixMonthsAgo().toISOString().slice(0, 10)),
      ))
      .groupBy(sql`1`)
      .orderBy(sql`1`),
  ]);

  const stageDistribution = Object.fromEntries(CKD_STAGES.map((s) => [s, 0])) as Record<CkdStage, number>;
  let totalPatients = 0;
  for (const row of stageRows) {
    totalPatients += row.value;
    if (row.stage) stageDistribution[row.stage] = row.value;
  }

  res.json({
    totalPatients,
    totalAppointments: appointmentCount.value,
    upcomingAppointments: upcomingCount.value,
    criticalAlerts: criticalCount.value,
    pendingLabResults: unreadLabCount.value,
    stageDistribution,
    egfrTrend: trendRows.map((r) => ({
      month: new Date(`${r.month}-01`).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
      value: r.value,
    })),
  });
}));

router.get("/recent-patients", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const recent = await db.query.patients.findMany({
    where: eq(patients.doctorId, doctor.id),
    orderBy: desc(patients.createdAt),
    limit: 4,
    ...patientWithRelations,
  });

  const enhanced = await Promise.all(recent.map(async (patient) => {
    const [latestDfg] = await db
      .select({ value: patientLabResults.resultValue })
      .from(patientLabResults)
      .innerJoin(labTests, eq(labTests.id, patientLabResults.labTestId))
      .where(and(eq(patientLabResults.patientId, patient.id), eq(labTests.testName, DFG_TEST_NAME)))
      .orderBy(desc(patientLabResults.resultDate), desc(patientLabResults.id))
      .limit(1);
    const [lastAppointment] = await db
      .select({ date: appointments.appointmentDate })
      .from(appointments)
      .where(eq(appointments.patientId, patient.id))
      .orderBy(desc(appointments.appointmentDate))
      .limit(1);
    return {
      ...serializePatient(patient),
      latestEGFR: latestDfg?.value ?? null,
      lastVisit: lastAppointment?.date ?? null,
    };
  }));

  res.json(enhanced);
}));

router.get("/upcoming-appointments", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const rows = await db.query.appointments.findMany({
    where: and(
      eq(appointments.doctorId, doctor.id),
      gte(appointments.appointmentDate, new Date()),
      ne(appointments.doctorStatus, "cancelled"),
    ),
    with: { patient: patientWithRelations, doctor: doctorWithUser },
    orderBy: asc(appointments.appointmentDate),
    limit: 5,
  });
  res.json(rows.map(serializeAppointment));
}));

router.get("/recent-alerts", asyncHandler(async (_req, res) => {
  const doctor: Doctor = res.locals.doctor;
  const rows = await db.query.notifications.findMany({
    where: and(eq(notifications.doctorId, doctor.id), inArray(notifications.severity, ["error", "warning"])),
    with: { patient: { with: { user: publicUserColumns } } },
    orderBy: desc(notifications.createdAt),
    limit: 5,
  });

  res.json(rows.map((n) => {
    const serialized = serializeNotification(n);
    const user = n.patient?.user;
    return {
      ...serialized,
      type: n.severity === "error" ? "critical" : "warning",
      title: n.severity === "error" ? "Alerte critique" : "Avertissement",
      patientId: n.patientId,
      patientInitials: user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : "",
      time: n.createdAt,
    };
  }));
}));

export default router;
