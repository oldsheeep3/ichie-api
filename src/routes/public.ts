import express from 'express';
import encountHandler from '../controllers/public/encount';

const router = express.Router();

router.get('/data/encount', encountHandler);

export default router;
