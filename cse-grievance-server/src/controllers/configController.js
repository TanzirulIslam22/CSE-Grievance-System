import * as configService from "../services/configService.js";

export async function getConfig(_req, res, next) {
  try {
    const all = await configService.getAllConfig();
    res.json(all);
  } catch (error) {
    next(error);
  }
}

export async function updateConfig(req, res, next) {
  try {
    const { values } = req.body || {};
    if (!values || typeof values !== "object") {
      return res.status(400).json({ error: "Provide { values: { key: value } }" });
    }
    const updated = await configService.setConfigs(values);
    res.json({ updated });
  } catch (error) {
    next(error);
  }
}