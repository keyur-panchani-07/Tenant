const { Router } = require('express');
const { body } = require('express-validator');
const authenticate = require('../middleware/auth');
const { getMessages, sendMessage } = require('../controllers/message.controller');

const router = Router();

router.use(authenticate);

router.get('/:groupId/messages', getMessages);

router.post(
  '/:groupId/messages',
  [body('content').trim().notEmpty().withMessage('Message content is required')],
  sendMessage
);

module.exports = router;
