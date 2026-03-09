import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MusicService } from './music.service';

@Controller('music')
export class MusicController {
    constructor(private musicService: MusicService) {}

    // GET /api/music/search?q=tên bài hát
    // UseGuards(AuthGuard('jwt')) → bảo vệ route, phải có token mới dùng được
    @Get('search')
    @UseGuards(AuthGuard('jwt'))
    search(@Query('q') query: string) {
        return this.musicService.searchMusic(query);
    }

    // Endpoint mới cho lazy load YouTube
    // Frontend gọi khi user click phát, không phải khi search
    @Get(':id/youtube')
    @UseGuards(AuthGuard('jwt'))
    getYoutubeId(
        @Param('id') spotifyId: string,
        @Query('title') title: string,
        @Query('artist') artist: string,
    ) {
        return this.musicService.getYoutubeId(spotifyId, title, artist);
    }

    // GET /api/music/:id → lấy chi tiết 1 bài theo spotifyId
    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    getTrack(@Param('id') spotifyId: string) {
        return this.musicService.getTrackBySpotifyId(spotifyId);
    }
}