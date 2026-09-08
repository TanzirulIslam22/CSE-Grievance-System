export function requirePermission(...permissions) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: "Role not loaded" });
    }

    const hasPermission = permissions.some((p) =>
      req.userRole.permissions.includes(p)
    );

    if (!hasPermission) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: permissions,
      });
    }

    next();
  };
}

export function requireAllPermissions(...permissions) {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(403).json({ error: "Role not loaded" });
    }

    const hasAllPermissions = permissions.every((p) =>
      req.userRole.permissions.includes(p)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        error: "Insufficient permissions",
        required: permissions,
      });
    }

    next();
  };
}

export function requireRole(...roleNames) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    if (!roleNames.includes(req.user.role)) {
      return res.status(403).json({
        error: "Access denied for your role",
        required: roleNames,
      });
    }

    next();
  };
}
