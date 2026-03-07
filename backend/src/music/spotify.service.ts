import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SpotifyService {
  private accessToken: string = '';
  private tokenExpiry: number = 0;

  constructor(
    private httpService: HttpService,
    private config: ConfigService,
  ) {}

  // token sống 1 tiếng, hết hạn thì tự lấy cái mới
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = this.config.get('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get('SPOTIFY_CLIENT_SECRET');
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await firstValueFrom(
      this.httpService.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    ) as any;

    this.accessToken = response.data.access_token;
    this.tokenExpiry = Date.now() + response.data.expires_in * 1000;
    return this.accessToken;
  }

  // tìm kiếm bài hát, trả về danh sách với metadata đầy đủ
  async searchTracks(query: string) {
  const token = await this.getAccessToken();
  const response = await this.httpService.axiosRef.get(
    'https://api.spotify.com/v1/search',
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { q: query, type: 'track', limit: 10 },
    }
  );

    // format lại data, chỉ lấy những gì cần
    return response.data.tracks.items.map((track: any) => ({
    spotifyId: track.id,
    title: track.name,
    artist: track.artists.map((a: any) => a.name).join(', '),
    album: track.album.name,
    duration_ms: track.duration_ms,
    image_url: track.album.images[0]?.url || null,
    preview_url: track.preview_url || null,
  }));
}

  // lấy thông tin chi tiết 1 bài hát theo spotify ID
  async getTrack(spotifyId: string) {
    const token = await this.getAccessToken();

    const response = await firstValueFrom(
      this.httpService.get(`https://api.spotify.com/v1/tracks/${spotifyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    );

    const track = response.data;
    return {
      spotifyId: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      album: track.album.name,
      duration_ms: track.duration_ms,
      image_url: track.album.images[0]?.url,
      preview_url: track.preview_url,
    };
  }
}