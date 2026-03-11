import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { Playlist, PlaylistSong, LikedSong, ListeningHistory } from './library.entity';
import { Song } from '../music/song.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Playlist, PlaylistSong, LikedSong, ListeningHistory, Song
    ]),
  ],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}