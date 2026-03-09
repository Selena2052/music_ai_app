import { Injectable } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';

@Injectable()
export class MusicService {
    constructor(
        private spotifyService: SpotifyService,
        private youtubeService: YoutubeService,
    ){}

    // Lazy load: chỉ trả Spotify data, KHÔNG gọi YouTube
    // YouTube sẽ được fetch khi user thực sự click phát

    async searchMusic(query: string) {
        const tracks = await this.spotifyService.searchTracks(query) as any[];
        // ytid = null, fe sẽ fetch sau khi cần
        return tracks.map((track) => ({ ...track, youtubeId: null}));
}

    // Endpoint riêng — chỉ gọi khi user click phát
    // Cache hit -> 0 units, Cache miss -> 100 units
    async getYoutubeId(spotifyId: string, title: string, artist: string): Promise<string | null> {
        const query = `${title} ${artist} official audio`;
        return this.youtubeService.searchVideo(query);
    }

    async getTrackBySpotifyId(spotifyId: string) {
        const track = await this.spotifyService.searchTracks(spotifyId);
        const youtubeId = await this.youtubeService.searchVideo(
            `${track.title} ${track.artist} official audio`
        );
        return { ...track, youtubeId };
    }
}