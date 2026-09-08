import { SystemConfig } from "../models/SystemConfig.js";

export const DEFAULT_CONFIG = {
  allowRegistration: { value: true, description: "Allow new users to self-register" },
  captchaEnabled: { value: true, description: "Require math captcha on login" },
  maxEvidenceSizeMb: { value: 10, description: "Maximum size of a single evidence file (MB)" },
  supportEmail: { value: "", description: "Department support / feedback email shown to users" },
  departmentName: { value: "Department of CSE, RUET", description: "Department name shown in the UI" },
};

export async function getAllConfig() {
  const docs = await SystemConfig.find().lean();
  const out = {};
  for (const [key, def] of Object.entries(DEFAULT_CONFIG)) {
    const found = docs.find((d) => d.key === key);
    out[key] = found ? found.value : def.value;
  }
  return out;
}

export async function getConfig(key) {
  const def = DEFAULT_CONFIG[key];
  const doc = await SystemConfig.findOne({ key }).lean();
  if (doc) return doc.value;
  return def ? def.value : undefined;
}

export async function setConfigs(values) {
  const updated = [];
  for (const [key, value] of Object.entries(values)) {
    if (!(key in DEFAULT_CONFIG)) continue;
    const def = DEFAULT_CONFIG[key];
    const doc = await SystemConfig.findOneAndUpdate(
      { key },
      { key, value, description: def.description },
      { upsert: true, new: true }
    ).lean();
    updated.push({ key: doc.key, value: doc.value });
  }
  return updated;
}

export async function seedSystemConfig() {
  for (const [key, def] of Object.entries(DEFAULT_CONFIG)) {
    const existing = await SystemConfig.findOne({ key });
    if (!existing) {
      await SystemConfig.create({ key, value: def.value, description: def.description });
    }
  }
  console.log("System config seeded.");
}