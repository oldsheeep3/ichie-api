import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { authRouter, dataRouter, publicRouter } from './routes';
import { authMiddleware } from './middleware/auth';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Make /public routes open, keep /auth signup/signin open, require auth for everything else
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/public')) {
    return next();
  }
  if (
    (req.path === '/auth/signup' || req.path === '/auth/signin') &&
    req.method === 'POST'
  ) {
    return next();
  }
  // for other routes, require auth
  return authMiddleware(req, res, next);
});

app.use('/auth', authRouter);
app.use('/data', dataRouter);
app.use('/public', publicRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  process.stdout.write(`Server listening on ${port}\n`);
});
