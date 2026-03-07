import { Injectable } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';

@Injectable()
export class MusicService {
    constructor(
        private spotifyService: SpotifyService,
        private youtubeService: YoutubeService,
    ){}

    async searchMusic(query: string) {
    const tracks = await this.spotifyService.searchTracks(query) as any[];

    const results = await Promise.all(
        tracks.map(async (track) => {
            let youtubeId: string | null = null;
            try {
                const youtubeQuery = `${track.title} ${track.artist} official`;
                youtubeId = await this.youtubeService.searchVideo(youtubeQuery);
            } catch {
                // YouTube quota hết → null, không crash
                youtubeId = null;
            }
            return { ...track, youtubeId };
        }),
    );

    return results;
}

    async getTrackBySpotifyId(spotifyId: string) {
        const track = await this.spotifyService.searchTracks(spotifyId);
        const youtubeQuery = `${track.title} ${track.artist} official`;
        const youtubeId = await this.youtubeService.searchVideo(youtubeQuery);
        return { ...track, youtubeId };
    }
}