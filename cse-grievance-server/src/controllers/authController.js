import * as authService from "../services/authService.js";
import * as captchaService from "../services/captchaService.js";
import { getConfig } from "../services/configService.js";

export async function register(req, res, next) {
  try {
    const { institutionalEmail, password, name, studentOrEmployeeId, role } = req.body;
    const result = await authService.register(
      institutionalEmail,
      password,
      name,
      studentOrEmployeeId,
      role,
      { captchaToken: req.body.captchaToken, captchaAnswer: req.body.captchaAnswer }
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password, {
      captchaToken: req.body.captchaToken,
      captchaAnswer: req.body.captchaAnswer,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function captchaStatus(_req, res) {
  const captchaEnabled =
    process.env.CAPTCHA_ENABLED !== "false" && (await getConfig("captchaEnabled")) !== false;
  res.json({ enabled: captchaEnabled });
}

export async function issueCaptcha(_req, res) {
  res.json(captchaService.issueCaptcha());
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    res.json({ tokens });
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    await authService.requestPasswordReset(email);
    res.json({ message: "If that email exists, a password reset link has been sent." });
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    res.json({ message: "Password updated. You can now sign in." });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  if (!req.userDoc || !req.userRole) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    user: {
      id: req.userDoc._id.toString(),
      email: req.userDoc.institutionalEmail,
      name: req.userDoc.name,
      role: req.userRole.name,
      department: req.userDoc.department,
      isVerified: req.userDoc.isVerified,
      studentOrEmployeeId: req.userDoc.studentOrEmployeeId,
    },
  });
}

export async function getPreferences(req, res) {
  if (!req.userDoc) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  res.json({
    preferences: {
      emailOnStatusChange: req.userDoc.notificationPrefs?.emailOnStatusChange !== false,
      emailOnMessages: req.userDoc.notificationPrefs?.emailOnMessages !== false,
    },
  });
}

export async function updatePreferences(req, res, next) {
  try {
    if (!req.userDoc) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const current = req.userDoc.notificationPrefs || {};
    const nextPrefs = {
      emailOnStatusChange:
        req.body.emailOnStatusChange !== undefined ? req.body.emailOnStatusChange : current.emailOnStatusChange,
      emailOnMessages:
        req.body.emailOnMessages !== undefined ? req.body.emailOnMessages : current.emailOnMessages,
    };

    req.userDoc.notificationPrefs = nextPrefs;
    await req.userDoc.save();

    res.json({ preferences: nextPrefs });
  } catch (error) {
    next(error);
  }
}
