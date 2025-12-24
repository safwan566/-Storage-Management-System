import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { config } from './config/environment';
import { logger } from './config/logger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import uploadRoutes from './routes/upload.routes';
import noteRoutes from './routes/note.routes';
import folderRoutes from './routes/folder.routes';
import storageRoutes from './routes/storage.routes';
import imageRoutes from './routes/image.routes';
import { errorHandler } from './middlewares/error.middleware';

const app: Application = express();

app.use(helmet());

app.use(cors({
  origin: config.env === 'production' ? ['https://yourdomain.com'] : '*',
  credentials: true,
}));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/api/uploads', express.static(path.join(process.cwd(), config.upload.path)));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: `Welcome to ${config.appName} API`,
    version: '1.0.0',
    status: 'Server is running',
  });
});

app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/images', imageRoutes);

app.use(errorHandler);

export default app;

