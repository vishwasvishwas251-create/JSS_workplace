// Central definition of who can do what

const PERMISSIONS = {
  super_admin: [
    "workspace:view", "workspace:update", "workspace:delete",
    "member:invite", "member:remove", "member:update_role",
    "board:create", "board:update", "board:delete",
    "task:create", "task:update", "task:delete", "task:assign",
    "comment:create",
  ],
  hod: [
    "workspace:view", "workspace:update",
    "member:invite", "member:remove", "member:update_role",
    "board:create", "board:update", "board:delete",
    "task:create", "task:update", "task:delete", "task:assign",
    "comment:create",
  ],
  faculty: [
    "workspace:view",
    "board:create", "board:update",
    "task:create", "task:update", "task:delete", "task:assign",
    "comment:create",
  ],
  club_president: [
    "workspace:view", "workspace:update",
    "member:invite", "member:remove",
    "board:create", "board:update", "board:delete",
    "task:create", "task:update", "task:delete", "task:assign",
    "comment:create",
  ],
  placement_officer: [
    "workspace:view",
    "board:create", "board:update",
    "task:create", "task:update", "task:delete", "task:assign",
    "comment:create",
  ],
  lab_incharge: [
    "workspace:view",
    "board:create", "board:update",
    "task:create", "task:update", "task:delete", "task:assign",
    "comment:create",
  ],
  student_lead: [
    "workspace:view",
    "board:create", "board:update",
    "task:create", "task:update", "task:assign",
    "comment:create",
  ],
  student: [
    "workspace:view",
    "task:create", "task:update",
    "comment:create",
  ],
  viewer: [
    "workspace:view",
  ],
};

const roleHasPermission = (role, permission) => {
  if (!PERMISSIONS[role]) return false;
  return PERMISSIONS[role].includes(permission);
};

module.exports = { PERMISSIONS, roleHasPermission };