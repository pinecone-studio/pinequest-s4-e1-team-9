import express from 'express';
import cors from 'cors';
import pdfRoutes from './routes/pdf.route.js';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.use('/api/pdf', pdfRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Admin backend listening at http://localhost:${port}`);
});
