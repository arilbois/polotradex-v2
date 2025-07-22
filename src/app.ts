import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import apiRouter from './api';
import { swaggerUiServe, swaggerUiSetup } from '@config/swagger'; // Baru

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(cors());

app.get('/', (req, res) => {
  res.status(200).send({
    message: 'PoloTradeX API is running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiRouter);

app.use('/api-docs', swaggerUiServe, swaggerUiSetup);

export default app;
