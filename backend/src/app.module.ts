import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { MusicModule } from './music/music.module';
import { AiModule } from './ai/ai.module';
import { CacheModule } from '@nestjs/cache-manager';
import { config } from 'process';
import { LibraryModule } from './library/library.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    // Redis Cache = global, dùng nhạc ở mọi module
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const redisPassword = config.get('REDIS_PASSWORD');
        return {
          store: 'ioredis',
          host: config.get('REDIS_HOST') || 'localhost',
          port: +(config.get('REDIS_PORT') || 6379),
          password: redisPassword || undefined,
          tls: redisPassword ? {} : undefined,
          ttl: 60 * 60 * 24,
          max: 10000,
        };
      },
      inject: [ConfigService],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: +(config.get<string>('DB_PORT') ?? '3000'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        ssl: { rejectUnauthorized: false },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        logging: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    MusicModule,
    AiModule,
    LibraryModule,
  ],
})
export class AppModule {}
