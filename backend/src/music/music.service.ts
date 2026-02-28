import { Injectable } from '@nestjs/common';
import { SpotifyService } from './spotify.service';
import { YoutubeService } from './youtube.service';

@Injectable()
export class MusicService {
    constructor(
        private spotifyService: SpotifyService,
        private youtubeService: YoutubeService,
    ){}

    // kết hợp Spotify + Youtube 
    // Spotify lấy medata đẹp, Youtube lấy videoId để embed player
    async searchMusic(query: string) {
        const tracks = await this.spotifyService.searchTracks(query) as any[];
        // với mỗi bài từ Spotify, tìm videoId Youtube tương ứng
        const results = await Promise.all(
            tracks.map(async (track) => {
                const youtubeQuery = `${track.title} ${track.artist} official`;
                const youtubeId = await this.youtubeService.searchVideo(youtubeQuery);
                return { ...track, youtubeId };
            }),
        );

        return results;
    }

    async getTrackBySpotifyId(spotifyId: string) {
        const track = await this.spotifyService.searchTracks(spotifyId);
        const youtubeQuery = `${track.title} ${track.artist} official`;
        const youtubeId = await this.youtubeService.searchVideo(youtubeQuery);
        return { ...(track as any), youtubeId };
    }
}