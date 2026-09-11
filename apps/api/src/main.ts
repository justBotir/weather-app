import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error', 'debug'] });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }),
  );

  // Only the Next.js server talks to us; in production this should be a private network.
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000', credentials: true });

  // Lets OnModuleDestroy actually run on SIGINT/SIGTERM, so Prisma disconnects.
  app.enableShutdownHooks();

  const port = Number(process.env.API_PORT ?? 4000);

  try {
    await app.listen(port);
  } catch (error) {
    // A stale `nest start --watch` child often survives Ctrl+C on Windows and keeps
    // the port. The raw EADDRINUSE stack says nothing about how to recover, and the
    // zombie still answers requests — with whatever .env it booted with.
    if ((error as NodeJS.ErrnoException).code === 'EADDRINUSE') {
      Logger.error(
        `Port ${port} is already in use — most likely a previous API process that did not shut down.\n` +
          `  Find it:  netstat -ano | grep ":${port}"\n` +
          `  Kill it:  powershell "Stop-Process -Id <PID> -Force"\n` +
          `  Warning:  that stale process still serves requests using its OWN copy of .env,\n` +
          `            so edits to your API key will appear to have no effect until it is gone.`,
        'Bootstrap',
      );
      process.exit(1);
    }
    throw error;
  }

  Logger.log(`API listening on http://localhost:${port}/api`, 'Bootstrap');
}

void bootstrap();
