import { User } from "../models/User.js";
import { Role } from "../models/Role.js";

export async function listUsers(query) {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: "i" } },
      { institutionalEmail: { $regex: query.search, $options: "i" } },
      { studentOrEmployeeId: { $regex: query.search, $options: "i" } },
    ];
  }
  if (query.role) filter.role = query.role;

  const [users, total] = await Promise.all([
    User.find(filter).populate("role").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const shaped = users.map((u) => ({
    _id: u._id.toString(),
    name: u.name,
    institutionalEmail: u.institutionalEmail,
    studentOrEmployeeId: u.studentOrEmployeeId,
    department: u.department,
    isVerified: u.isVerified,
    role: u.role ? u.role.name : null,
    createdAt: u.createdAt,
  }));

  return { users: shaped, total, page, limit };
}

export async function listRoles() {
  const roles = await Role.find().sort({ createdAt: 1 }).lean();
  return roles.map((r) => ({
    _id: r._id.toString(),
    name: r.name,
    permissions: r.permissions,
  }));
}

export async function updateUserRole(userId, roleName) {
  const role = await Role.findOne({ name: roleName });
  if (!role) {
    const err = new Error("Role not found");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error("User not found");
    err.statusCode = 404;
    throw err;
  }

  user.role = role._id;
  await user.save();

  return {
    _id: user._id.toString(),
    name: user.name,
    institutionalEmail: user.institutionalEmail,
    role: role.name,
  };
}
