const { validationResult } = require('express-validator');
const prisma = require('../config/db');

async function assertGroupMembership(userId, groupId, orgId) {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group || group.orgId !== orgId) return null;

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  return membership ? group : null;
}

async function getMessages(req, res) {
  const { groupId } = req.params;
  const { userId, orgId } = req.user;
  const limit = Math.min(parseInt(req.query.limit) || 50, 100);

  try {
    const group = await assertGroupMembership(userId, groupId, orgId);
    if (!group) {
      return res.status(403).json({ error: 'Access denied or group not found' });
    }

    const messages = await prisma.message.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    // Return in chronological order
    return res.json(messages.reverse());
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function sendMessage(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { groupId } = req.params;
  const { content } = req.body;
  const { userId, orgId } = req.user;

  try {
    const group = await assertGroupMembership(userId, groupId, orgId);
    if (!group) {
      return res.status(403).json({ error: 'Access denied or group not found' });
    }

    const message = await prisma.message.create({
      data: { content, userId, groupId },
      include: {
        user: { select: { id: true, email: true } },
      },
    });

    // Broadcast via Socket.IO — io is attached to app in app.js
    const io = req.app.get('io');
    if (io) {
      const room = `org:${orgId}:group:${groupId}`;
      io.to(room).emit('receive_message', {
        id: message.id,
        content: message.content,
        groupId: message.groupId,
        sender: message.user,
        createdAt: message.createdAt,
      });
    }

    return res.status(201).json(message);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { getMessages, sendMessage };
