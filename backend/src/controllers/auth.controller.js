const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const prisma = require('../config/db');

const SALT_ROUNDS = 12;

function signToken(userId, orgId, role) {
  return jwt.sign({ userId, orgId, role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

async function registerOrgAdmin(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { orgName, email, password } = req.body;

  try {
    const existingOrg = await prisma.organization.findUnique({ where: { name: orgName } });
    if (existingOrg) {
      return res.status(409).json({ error: 'Organization name already taken' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create org and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name: orgName } });
      const user = await tx.user.create({
        data: { email, passwordHash, role: 'ADMIN', orgId: org.id },
      });
      return { org, user };
    });

    const token = signToken(result.user.id, result.org.id, 'ADMIN');

    return res.status(201).json({
      token,
      user: { id: result.user.id, email: result.user.email, role: result.user.role },
      org: { id: result.org.id, name: result.org.name },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function login(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken(user.id, user.orgId, user.role);

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role, orgId: user.orgId },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function inviteMember(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const { orgId } = req.user;

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { email, passwordHash, role: 'MEMBER', orgId },
    });

    return res.status(201).json({
      user: { id: user.id, email: user.email, role: user.role, orgId: user.orgId },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = { registerOrgAdmin, login, inviteMember };
