import app from './app';
import { config } from './config/environment';
import { logger } from './config/logger';
import { connectDatabase } from './config/database';
import fs from 'fs';
import path from 'path';

// Create necessary directories
const createDirectories = () => {
  const dirs = [
    'logs',
    config.upload.path,
  ];
  
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created directory: ${dir}`);
    }
  });
};

// Start server
const startServer = async () => {
  try {
    // Create directories
    createDirectories();
    
    // Connect to database
    await connectDatabase();
    
    // Start listening
    const server = app.listen(config.port, () => {
      logger.info(`
        ====================================
        🚀 Server running on port ${config.port}
        📝 Environment: ${config.env}
        🔗 URL: http://localhost:${config.port}
        ====================================
      `);
    });
    
    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          const { disconnectDatabase } = await import('./config/database');
          await disconnectDatabase();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    // Listen for termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason: Error) => {
  logger.error('Unhandled Rejection:', reason);
  throw reason;
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

