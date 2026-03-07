import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { MusicController } from './music.controller';
import { MusicService } from './music.service';
import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';
import { SpotifyAuthController } from './spotify-auth.controller';

@Module({
    imports: [HttpModule],
    controllers: [MusicController, SpotifyAuthController],
    providers: [MusicService, SpotifyService, YoutubeService],
    exports: [MusicService],
})
export class MusicModule {}