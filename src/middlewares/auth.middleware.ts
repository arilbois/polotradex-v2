import { Request, Response, NextFunction } from 'express';
import config from '@config/index';

/**
 * Middleware untuk memvalidasi Bearer Token di header Authorization.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!config.apiSecretKey) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: Authorization header is missing or invalid.' });
  }

  const token = authHeader.split(' ')[1];

  if (token !== config.apiSecretKey) {
    return res.status(403).json({ message: 'Forbidden: Invalid API key.' });
  }

  next();
};