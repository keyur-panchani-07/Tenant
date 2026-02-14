const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { createGroup, listGroups, addMember } = require('../controllers/group.controller');

const router = Router();

router.use(authenticate);

router.post(
  '/',
  requireRole('ADMIN'),
  [body('name').trim().notEmpty().withMessage('Group name is required')],
  createGroup
);

router.get('/', listGroups);

router.post(
  '/:groupId/members',
  requireRole('ADMIN'),
  [body('userId').notEmpty().withMessage('userId is required')],
  addMember
);

module.exports = router;
