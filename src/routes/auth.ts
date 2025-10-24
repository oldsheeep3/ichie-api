import express from 'express';
import signupHandler from '../controllers/auth/signup';
import signinHandler from '../controllers/auth/signin';
import updateHandler from '../controllers/auth/update';
import meHandler from '../controllers/auth/me';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.post('/signup', signupHandler);
router.post('/signin', signinHandler);
router.put('/update', authMiddleware, updateHandler);
router.get('/me', authMiddleware, meHandler);

export default router;
