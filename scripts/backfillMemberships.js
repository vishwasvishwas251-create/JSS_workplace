require("dotenv").config();
const mongoose = require("mongoose");
const Workspace = require("../src/models/Workspace");
const Membership = require("../src/models/Membership");

// All roles valid in the Membership model
const VALID_ROLES = [
  "super_admin",
  "hod",
  "faculty",
  "club_president",
  "placement_officer",
  "lab_incharge",
  "student_lead",
  "student",
  "viewer",
];

// Maps Workspace.members[].role → Membership.role
const roleMap = {
  owner: "super_admin",
  admin: "hod",
  member: "student",
  viewer: "viewer",
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    const workspaces = await Workspace.find({});
    console.log(`Found ${workspaces.length} workspaces`);

    let created = 0;
    let skipped = 0;

    for (const ws of workspaces) {
      for (const member of ws.members) {
        const exists = await Membership.findOne({
          workspace: ws._id,
          user: member.user,
        });

        if (exists) {
          skipped++;
          continue;
        }

        // If the embedded role is already a valid Membership role, use it.
        // Otherwise map it (e.g. "owner" → "super_admin").
        const mappedRole = VALID_ROLES.includes(member.role)
          ? member.role
          : roleMap[member.role] || "student";

        await Membership.create({
          workspace: ws._id,
          user: member.user,
          role: mappedRole,
          status: "active",
        });
        created++;
      }
    }

    console.log(
      `✅ Created ${created} memberships (skipped ${skipped} existing)`
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

run();