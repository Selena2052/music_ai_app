import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ChatHistory, UserMood } from './ai.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([ChatHistory, UserMood]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}