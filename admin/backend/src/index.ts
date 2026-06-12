import express from 'express';
import cors from 'cors';
import pdfRoutes from './routes/pdf.route.js';
import companyRoutes from './routes/company.route.js';

import { env } from './config/env.js';

const app = express();
const port = env.port;

app.use(cors({
  origin: env.frontendOrigins,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/pdf', pdfRoutes);
app.use('/api/companies', companyRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Admin backend listening at http://localhost:${port}`);
});
