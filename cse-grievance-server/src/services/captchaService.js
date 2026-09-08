import jwt from "jsonwebtoken";
import { config } from "../config/index.js";

const OPS = ["+", "-"];

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function generateQuestion() {
  const op = OPS[randomInt(OPS.length)];
  const a = 1 + randomInt(20);
  const b = 1 + randomInt(20);
  if (op === "-" && b > a) return { op: "-", a: b, b: a };
  return { op, a, b };
}

function evaluate(q) {
  return q.op === "+" ? q.a + q.b : q.a - q.b;
}

export function issueCaptcha() {
  const q = generateQuestion();
  const token = jwt.sign(
    { type: "captcha", a: q.a, b: q.b, op: q.op },
    config.jwt.secret,
    { expiresIn: "5m" }
  );
  return { token, question: `What is ${q.a} ${q.op} ${q.b}?` };
}

export function verifyCaptcha(token, answer) {
  if (!token || answer === undefined || answer === null || answer === "") {
    return false;
  }
  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    if (decoded.type !== "captcha") return false;
    const expected = evaluate(decoded);
    return Number(answer) === expected;
  } catch {
    return false;
  }
}