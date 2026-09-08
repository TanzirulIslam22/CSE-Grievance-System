import { sendWeeklyReport } from "../services/reportService.js";

let timer = null;
let running = false;

function msToNextWeeklyReport(reportDay, reportHour) {
  const now = new Date();
  const next = new Date(now);
  next.setHours(reportHour, 0, 0, 0);
  const diffDays = (reportDay - now.getDay() + 7) % 7;
  if (diffDays === 0 && now.getHours() >= reportHour) {
    next.setDate(next.getDate() + 7);
  } else {
    next.setDate(next.getDate() + diffDays);
  }
  return next.getTime() - now.getTime();
}

async function runReport() {
  if (running) return;
  running = true;
  try {
    const result = await sendWeeklyReport();
    console.log(`[Report] Weekly report sent (${result.sent} recipients, ${result.total} cases)`);
  } catch (error) {
    console.error("[Report] send error:", error.message);
  } finally {
    running = false;
  }
}

function schedule() {
  if (timer) clearTimeout(timer);

  const overrideMs = parseInt(process.env.REPORT_INTERVAL_MS || "", 10);
  if (Number.isFinite(overrideMs) && overrideMs > 0) {
    console.log(`[Report] Dev schedule: every ${Math.round(overrideMs / 1000)}s`);
    timer = setTimeout(async () => {
      await runReport();
      schedule();
    }, overrideMs);
    return;
  }

  const reportDay = parseInt(process.env.REPORT_DAY ?? "1", 10); // 0=Sun ... 1=Mon
  const reportHour = parseInt(process.env.REPORT_HOUR ?? "9", 10);
  const waitMs = msToNextWeeklyReport(reportDay, reportHour);
  console.log(
    `[Report] Weekly schedule: day ${reportDay} at ${reportHour}:00 (next run in ${Math.round(waitMs / 3600000)}h)`
  );
  timer = setTimeout(async () => {
    await runReport();
    schedule();
  }, waitMs);
}

export function startReportJob() {
  schedule();
}

export function stopReportJob() {
  if (timer) clearTimeout(timer);
  timer = null;
}