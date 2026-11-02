// ─────────────────────────────────────────────
// JOIN BY INVITE CODE
// ─────────────────────────────────────────────
exports.joinByInviteCode = async (req, res) => {
  try {
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res.status(400).json({ message: "Invite code is required" });
    }

    const workspace = await Workspace.findOne({
      inviteCode: inviteCode.trim().toUpperCase(),
    });

    if (!workspace) {
      return res.status(404).json({ message: "Invalid invite code" });
    }

    // Check if already a member
    const alreadyMember = workspace.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (alreadyMember) {
      return res.status(400).json({ message: "You are already a member" });
    }

    // Add as student by default
    workspace.members.push({
      user: req.user._id,
      role: "student",
    });

    await workspace.save();
    await workspace.populate("members.user", "name email avatar");

    res.status(200).json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// UPDATE MEMBER ROLE
// ─────────────────────────────────────────────
exports.updateMemberRole = async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Requester must be admin
    const requester = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || !["super_admin", "admin"].includes(requester.role)) {
      return res.status(403).json({ message: "Only admins can change roles" });
    }

    // Target member
    const member = workspace.members.find(
      (m) => m.user.toString() === userId
    );
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Protect the owner
    if (member.role === "super_admin") {
      return res.status(403).json({ message: "Cannot change owner's role" });
    }

    member.role = role;
    await workspace.save();
    await workspace.populate("members.user", "name email avatar");

    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─────────────────────────────────────────────
// REMOVE MEMBER
// ─────────────────────────────────────────────
exports.removeMember = async (req, res) => {
  try {
    const { id, userId } = req.params;

    const workspace = await Workspace.findById(id);
    if (!workspace) {
      return res.status(404).json({ message: "Workspace not found" });
    }

    // Requester must be admin
    const requester = workspace.members.find(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!requester || !["super_admin", "admin"].includes(requester.role)) {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    const member = workspace.members.find(
      (m) => m.user.toString() === userId
    );
    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    if (member.role === "super_admin") {
      return res.status(403).json({ message: "Cannot remove the owner" });
    }

    workspace.members = workspace.members.filter(
      (m) => m.user.toString() !== userId
    );
    await workspace.save();
    await workspace.populate("members.user", "name email avatar");

    res.json(workspace);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};