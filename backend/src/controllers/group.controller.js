const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function createGroup(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;
  const { orgId } = req.user;

  try {
    const group = await prisma.group.create({
      data: { name, orgId },
    });

    return res.status(201).json(group);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Group name already exists in this organization' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function listGroups(req, res) {
  const { userId, orgId } = req.user;

  try {
    const memberships = await prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: true,
      },
    });

    // Filter to only groups within the user's org (belt-and-suspenders)
    const groups = memberships
      .map((m) => m.group)
      .filter((g) => g.orgId === orgId);

    return res.json(groups);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function addMember(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { groupId } = req.params;
  const { userId: targetUserId } = req.body;
  const { orgId } = req.user;

  try {
    // Verify group belongs to admin's org
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.orgId !== orgId) {
      return res.status(404).json({ error: 'Group not found' });
    }

    // Verify target user belongs to same org
    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!targetUser || targetUser.orgId !== orgId) {
      return res.status(404).json({ error: 'User not found in this organization' });
    }

    await prisma.groupMember.upsert({
      where: { userId_groupId: { userId: targetUserId, groupId } },
      update: {},
      create: { userId: targetUserId, groupId },
    });

    return res.status(200).json({ message: 'Member added successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { createGroup, listGroups, addMember };
