import express from 'express';
import { env } from './config/env';
import { PrismaClient } from '@prisma/client';
import rfpRoutes from './routes/rfp.routes';
import vendorRoutes from './routes/vendor.routes';

import cors from 'cors';

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.use('/api/rfps', rfpRoutes);
app.use('/api/vendors', vendorRoutes);

app.use((err: any, req: express.Request, res: express.Response, next: Function) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
  console.log(`Database URL: ${env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
