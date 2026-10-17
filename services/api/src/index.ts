import express from 'express';
import cors from 'cors';

import { config } from './config.js';
import authRouter from './auth/auth.routes.js';
import financeRouter from './finance/finance.routes.js';
import adminRouter from './admin/admin.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.use('/api/auth', authRouter);
app.use('/api', financeRouter);
app.use('/api/admin', adminRouter);

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});
