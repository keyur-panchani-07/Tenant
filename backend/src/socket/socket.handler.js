const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

function roomName(orgId, groupId) {
  // Namespaced rooms prevent cross-org collisions
  return `org:${orgId}:group:${groupId}`;
}

function initSocket(io) {
  // JWT authentication middleware for every socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = payload; // { userId, orgId, role }
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, orgId } = socket.user;
    console.log(`Socket connected: userId=${userId} orgId=${orgId}`);

    socket.on('join_group', async ({ groupId }) => {
      if (!groupId) {
        return socket.emit('error', { message: 'groupId is required' });
      }

      try {
        // Verify group belongs to user's org
        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (!group || group.orgId !== orgId) {
          return socket.emit('error', { message: 'Group not found' });
        }

        // Verify user is a member
        const membership = await prisma.groupMember.findUnique({
          where: { userId_groupId: { userId, groupId } },
        });
        if (!membership) {
          return socket.emit('error', { message: 'You are not a member of this group' });
        }

        const room = roomName(orgId, groupId);
        socket.join(room);
        socket.emit('joined_group', { groupId, room });
      } catch (err) {
        console.error('join_group error:', err);
        socket.emit('error', { message: 'Internal error' });
      }
    });

    socket.on('send_message', async ({ groupId, content }) => {
      if (!groupId || !content?.trim()) {
        return socket.emit('error', { message: 'groupId and content are required' });
      }

      try {
        // Verify membership (same checks as HTTP)
        const group = await prisma.group.findUnique({ where: { id: groupId } });
        if (!group || group.orgId !== orgId) {
          return socket.emit('error', { message: 'Group not found' });
        }

        const membership = await prisma.groupMember.findUnique({
          where: { userId_groupId: { userId, groupId } },
        });
        if (!membership) {
          return socket.emit('error', { message: 'You are not a member of this group' });
        }

        const message = await prisma.message.create({
          data: { content: content.trim(), userId, groupId },
          include: { user: { select: { id: true, email: true } } },
        });

        const room = roomName(orgId, groupId);
        io.to(room).emit('receive_message', {
          id: message.id,
          content: message.content,
          groupId: message.groupId,
          sender: message.user,
          createdAt: message.createdAt,
        });
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', { message: 'Internal error' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: userId=${userId}`);
    });
  });
}

module.exports = initSocket;
