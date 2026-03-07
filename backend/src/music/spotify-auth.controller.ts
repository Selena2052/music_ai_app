import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('auth/spotify')
export class SpotifyAuthController {
  constructor(private config: ConfigService) {}

  @Get('login')
  login(@Res() res: Response) {
    const clientId = this.config.get('SPOTIFY_CLIENT_ID');
    const redirectUri = this.config.get('SPOTIFY_REDIRECT_URI');

    const scopes = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state',
    ].join(' ');

    const url = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes);

    res.redirect(url.toString());
  }

  @Get('callback')
  async callback(@Query('code') code: string, @Res() res: Response) {
    const clientId = this.config.get('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get('SPOTIFY_CLIENT_SECRET');
    const redirectUri = this.config.get('SPOTIFY_REDIRECT_URI');

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: body.toString(),
    });

    const data = await response.json() as any;

    // redirect về frontend kèm tokens
    const frontendUrl = new URL('http://localhost:3002/callback');
    frontendUrl.searchParams.set('access_token', data.access_token);
    frontendUrl.searchParams.set('refresh_token', data.refresh_token);
    frontendUrl.searchParams.set('expires_in', String(data.expires_in));
    res.redirect(frontendUrl.toString());
  }

  // refresh token khi hết hạn
  @Get('refresh')
  async refresh(@Query('refresh_token') refreshToken: string, @Res() res: Response) {
    const clientId = this.config.get('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get('SPOTIFY_CLIENT_SECRET');

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: body.toString(),
    });

    const data = await response.json();
    res.json(data);
  }
}