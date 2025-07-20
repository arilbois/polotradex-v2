// src/server.ts
import app from './app';
import config from '@config/index';
import { logger } from '@infrastructure/logger';

const server = app.listen(config.port, () => {
  logger.info(`=================================`);
  logger.info(`======= ENV: ${config.nodeEnv} =======`);
  logger.info(`🚀 App listening on the port ${config.port}`);
  logger.info(`=================================`);
});

// Penanganan untuk proses exit yang bersih
const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error: Error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});