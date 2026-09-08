import nodemailer from "nodemailer";
import { config } from "../config/index.js";
import { User } from "../models/User.js";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!config.email.host) return null;
  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465,
    auth:
      config.email.user && config.email.pass
        ? { user: config.email.user, pass: config.email.pass }
        : undefined,
  });
  return transporter;
}

export async function sendEmail(to, subject, text) {
  if (!to) return;
  try {
    const t = getTransporter();
    if (t) {
      await t.sendMail({ from: config.email.from, to, subject, text });
    } else {
      // Development fallback: log the message instead of sending.
      console.log(
        `\n[EMAIL:dev] ${new Date().toISOString()}\n  To: ${to}\n  Subject: ${subject}\n  Body: ${text}\n`
      );
    }
  } catch (error) {
    console.error("Email send error:", error.message);
  }
}

async function findUserEmail(userId) {
  try {
    const user = await User.findById(userId).select("institutionalEmail").lean();
    return user ? user.institutionalEmail : null;
  } catch {
    return null;
  }
}

export async function notifyNewCase(caseDoc) {
  const recipients = await User.find({ role: { $exists: true } })
    .populate("role")
    .select("institutionalEmail")
    .lean();
  const hodAdmins = recipients.filter(
    (u) => u.role && ["hod", "admin"].includes(u.role.name)
  );
  const emails = [...new Set(hodAdmins.map((u) => u.institutionalEmail))];
  if (emails.length === 0) return;

  const subject = `New grievance submitted: ${caseDoc.caseId}`;
  const text = [
    `A new complaint has been submitted.`,
    ``,
    `Case: ${caseDoc.caseId}`,
    `Category: ${caseDoc.category}`,
    `Priority: ${caseDoc.priority}`,
    `Privacy mode: ${caseDoc.privacyMode}`,
    `Title: ${caseDoc.title}`,
    ``,
    `Sign in to review: ${config.clientUrl}/cases/${caseDoc._id}`,
  ].join("\n");

  for (const email of emails) {
    await sendEmail(email, subject, text);
  }
}

export async function notifyStatusChange(publicCaseId, urlSlug, ownerUserId, fromStatus, toStatus) {
  const email = await findUserEmail(ownerUserId);
  if (!email) return;
  await sendEmail(
    email,
    `Grievance ${publicCaseId}: status changed to ${toStatus.replace(/_/g, " ")}`,
    [
      `Your grievance ${publicCaseId} changed status.`,
      ``,
      `From: ${fromStatus.replace(/_/g, " ")}`,
      `To: ${toStatus.replace(/_/g, " ")}`,
      ``,
      `Track it here: ${config.clientUrl}/cases/${urlSlug}`,
    ].join("\n")
  );
}

export async function notifyNewMessage(publicCaseId, urlSlug, senderRoleLabel, recipientUserId, preview) {
  const email = await findUserEmail(recipientUserId);
  if (!email) return;
  await sendEmail(
    email,
    `New message on grievance ${publicCaseId}`,
    [
      `You received a new ${senderRoleLabel} message regarding ${publicCaseId}.`,
      ``,
      `"${preview}"`,
      ``,
      `Reply here: ${config.clientUrl}/cases/${urlSlug}`,
    ].join("\n")
  );
}

export async function notifyIdentityRevealed(caseD, ownerUserId) {
  const email = await findUserEmail(ownerUserId);
  if (!email) return;
  await sendEmail(
    email,
    `Privacy notice for grievance ${caseD.caseId}`,
    [
      `Your grievance ${caseD.caseId} has been handled with your identity disclosed to the HoD.`,
      ``,
      `If this was not expected, contact the department.`,
    ].join("\n")
  );
}