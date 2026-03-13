import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { ChatHistory, UserMood, SongStory, LyricsExplanation } from './ai.entity';
import { UserTasteProfile } from '../users/user-taste.entity';
import { Song } from '../music/song.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      ChatHistory, 
      UserMood,
      SongStory,
      LyricsExplanation,
      UserTasteProfile,
      Song,
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}