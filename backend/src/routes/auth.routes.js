const { Router } = require('express');
const { body } = require('express-validator');
const { registerOrgAdmin, login, inviteMember } = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = Router();

router.post(
  '/register-org-admin',
  [
    body('orgName').trim().notEmpty().withMessage('orgName is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  registerOrgAdmin
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

router.post(
  '/invite-member',
  authenticate,
  requireRole('ADMIN'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  inviteMember
);

module.exports = router;
