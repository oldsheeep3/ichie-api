import express from 'express';
import { authMiddleware } from '../middleware/auth';
import encountPostHandler from '../controllers/data/encountPost';
import encountMeGetHandler from '../controllers/data/encountMeGet';

const router = express.Router();

router.post('/encount', authMiddleware, encountPostHandler);
router.get('/encount/me', authMiddleware, encountMeGetHandler);

export default router;
