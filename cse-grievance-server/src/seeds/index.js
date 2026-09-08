import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config/index.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { SystemConfig } from "../models/SystemConfig.js";
import { ROLES, PERMISSIONS } from "../config/constants.js";
import { DEFAULT_CONFIG } from "../services/configService.js";

const roleDefinitions = {
  [ROLES.STUDENT]: [
    PERMISSIONS.CASE_CREATE, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_UPDATE_OWN,
    PERMISSIONS.CASE_DELETE_OWN, PERMISSIONS.EVIDENCE_UPLOAD, PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.CASE_RESPOND,
  ],
  [ROLES.TEACHER]: [
    PERMISSIONS.CASE_CREATE, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_UPDATE_OWN,
    PERMISSIONS.CASE_DELETE_OWN, PERMISSIONS.EVIDENCE_UPLOAD, PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.CASE_RESPOND,
  ],
  [ROLES.FACULTY]: [
    PERMISSIONS.CASE_CREATE, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_UPDATE_OWN,
    PERMISSIONS.CASE_DELETE_OWN, PERMISSIONS.EVIDENCE_UPLOAD, PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.CASE_RESPOND,
  ],
  [ROLES.STAFF]: [
    PERMISSIONS.CASE_CREATE, PERMISSIONS.CASE_READ_OWN, PERMISSIONS.CASE_UPDATE_OWN,
    PERMISSIONS.CASE_DELETE_OWN, PERMISSIONS.EVIDENCE_UPLOAD, PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.CASE_RESPOND,
  ],
  [ROLES.HOD]: [
    PERMISSIONS.CASE_READ_ALL, PERMISSIONS.CASE_UPDATE_ALL, PERMISSIONS.CASE_STATUS_UPDATE,
    PERMISSIONS.CASE_RESPOND, PERMISSIONS.CASE_REVEAL_IDENTITY, PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.USER_READ, PERMISSIONS.AUDIT_READ, PERMISSIONS.ANALYTICS_READ,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.CASE_READ_ALL, PERMISSIONS.CASE_UPDATE_ALL, PERMISSIONS.CASE_DELETE_ALL,
    PERMISSIONS.CASE_STATUS_UPDATE, PERMISSIONS.CASE_REVEAL_IDENTITY, PERMISSIONS.EVIDENCE_READ,
    PERMISSIONS.USER_READ, PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE,
    PERMISSIONS.USER_MANAGE_ROLES, PERMISSIONS.AUDIT_READ, PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.ANALYTICS_READ,
  ],
};

const demoUsers = [
  { email: "xyz@cse.ruet.ac.bd", name: "Dr. XYZ", id: "T001", role: ROLES.TEACHER },
  { email: "2203054@student.ruet.ac.bd", name: "Tanvir Ahmed", id: "2203054", role: ROLES.STUDENT },
  { email: "hod@cse.ruet.ac.bd", name: "Prof. Department Head", id: "HOD001", role: ROLES.HOD },
  { email: "admin@cse.ruet.ac.bd", name: "System Admin", id: "ADM001", role: ROLES.ADMIN },
];

async function seed() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log("Connected to MongoDB for seeding...");

    await Role.deleteMany({});
    await User.deleteMany({});
    await SystemConfig.deleteMany({});
    console.log("Cleared existing roles, users, and system config.");

    const roleDocs = {};
    for (const [name, permissions] of Object.entries(roleDefinitions)) {
      const role = await Role.create({ name, permissions });
      roleDocs[name] = role;
      console.log(`Created role: ${name} (${permissions.length} permissions)`);
    }

    const defaultPassword = await bcrypt.hash("password123", 12);

    for (const userData of demoUsers) {
      await User.create({
        institutionalEmail: userData.email,
        passwordHash: defaultPassword,
        role: roleDocs[userData.role]._id,
        name: userData.name,
        studentOrEmployeeId: userData.id,
        department: "CSE",
        isVerified: true,
      });
      console.log(`Created user: ${userData.name} (${userData.email}) [${userData.role}]`);
    }

    for (const [key, def] of Object.entries(DEFAULT_CONFIG)) {
      await SystemConfig.create({ key, value: def.value, description: def.description });
    }
    console.log("Seeded system configuration defaults.");

    console.log("\n--- Seed Complete ---");
    console.log("Demo login credentials (all passwords: password123):");
    demoUsers.forEach((u) => {
      console.log(`  ${u.role.padEnd(10)} -> ${u.email}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error);
    process.exit(1);
  }
}

seed();
