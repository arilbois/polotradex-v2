import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './api'; 

const app: Application = express();

// Middlewares
app.use(express.json()); // Untuk parsing body JSON
app.use(express.urlencoded({ extended: true }));
app.use(helmet()); // Untuk keamanan dasar HTTP headers
app.use(cors()); // Mengizinkan Cross-Origin Resource Sharing

// Route Utama
app.get('/', (req, res) => {
  res.status(200).send({
    message: 'PoloTradeX API is running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

// Menggunakan router utama untuk semua rute di bawah /api
app.use('/api', apiRouter);

// Nanti kita akan tambahkan error handling middleware di sini

export default app;