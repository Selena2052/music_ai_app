import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Playlist, PlaylistSong, LikedSong, ListeningHistory } from './library.entity';
import { Song } from '../music/song.entity';

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(Playlist)
    private playlistRepo: Repository<Playlist>,

    @InjectRepository(PlaylistSong)
    private playlistSongRepo: Repository<PlaylistSong>,

    @InjectRepository(LikedSong)
    private likedSongRepo: Repository<LikedSong>,

    @InjectRepository(ListeningHistory)
    private historyRepo: Repository<ListeningHistory>,

    @InjectRepository(Song)
    private songRepo: Repository<Song>,
  ) {}

  // Khi user like/thêm vào playlist, bài hát phải tồn tại trong DB trước
  async upsertSong(songData: {
    spotifyId: string; title: string; artist: string;
    album?: string; durationMs?: number; imageUrl?: string;
    previewUrl?: string; youtubeId?: string;
  }): Promise<Song> {
    let song = await this.songRepo.findOne({
      where: { spotifyId: songData.spotifyId }
    });

    if (!song) {
      song = this.songRepo.create({
        spotifyId: songData.spotifyId,
        title: songData.title,
        artist: songData.artist,
        album: songData.album,
        durationMs: songData.durationMs,
        imageUrl: songData.imageUrl,
        previewUrl: songData.previewUrl,
        youtubeId: songData.youtubeId,
      });
      await this.songRepo.save(song);
    }

    return song;
  }

  // LIKED SONGS

  async getLikedSongs(userId: string) {
    const liked = await this.likedSongRepo.find({
      where: { userId },
      relations: ['song'],
      order: { likedAt: 'DESC' },
    });

    return liked.map(l => this.formatSong(l.song));
  }

  async likeSong(userId: string, songData: any) {
    const song = await this.upsertSong(songData);

    // tránh like trùng
    const existing = await this.likedSongRepo.findOne({
      where: { userId, songId: song.id }
    });
    if (existing) return { ok: true };

    await this.likedSongRepo.save(
      this.likedSongRepo.create({ userId, songId: song.id })
    );
    return { ok: true };
  }

  async unlikeSong(userId: string, spotifyId: string) {
    const song = await this.songRepo.findOne({ where: { spotifyId } });
    if (!song) return { ok: true };

    await this.likedSongRepo.delete({ userId, songId: song.id });
    return { ok: true };
  }

  async isLiked(userId: string, spotifyId: string): Promise<boolean> {
    const song = await this.songRepo.findOne({ where: { spotifyId } });
    if (!song) return false;

    const liked = await this.likedSongRepo.findOne({
      where: { userId, songId: song.id }
    });
    return !!liked;
  }

  // PLAYLISTS 

  async getPlaylists(userId: string) {
    const playlists = await this.playlistRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });

    // lấy songs cho từng playlist
    const result = await Promise.all(
      playlists.map(async (pl) => {
        const songs = await this.getPlaylistSongs(pl.id);
        return {
          id: pl.id,
          name: pl.name,
          image_url: pl.coverImage,
          song_count: songs.length,
          song: songs,
        };
      })
    );

    return result;
  }

  async createPlaylist(userId: string, name: string) {
    const pl = this.playlistRepo.create({ userId, name });
    const saved = await this.playlistRepo.save(pl);
    return { id: saved.id, name: saved.name, image_url: null, song_count: 0, song: [] };
  }

  async updatePlaylistImage(playlistId: string, userId: string, imageUrl: string) {
    await this.playlistRepo.update(
      { id: playlistId, userId },
      { coverImage: imageUrl }
    );
    return { ok: true };
  }

  async deletePlaylist(playlistId: string, userId: string) {
    await this.playlistRepo.delete({ id: playlistId, userId });
    return { ok: true };
  }

  async getPlaylistSongs(playlistId: string) {
    const items = await this.playlistSongRepo.find({
      where: { playlistId },
      relations: ['song'],
      order: { position: 'ASC', addedAt: 'DESC' },
    });

    return items.map(i => this.formatSong(i.song)).filter(Boolean);
  }

  async addSongToPlaylist(playlistId: string, songData: any) {
    const song = await this.upsertSong(songData);

    // tránh thêm trùng
    const existing = await this.playlistSongRepo.findOne({
      where: { playlistId, songId: song.id }
    });
    if (existing) return { ok: true };

    // lấy position cuối cùng
    const count = await this.playlistSongRepo.count({ where: { playlistId } });

    await this.playlistSongRepo.save(
      this.playlistSongRepo.create({
        playlistId,
        songId: song.id,
        position: count + 1,
      })
    );

    if (song.imageUrl) {
    const playlist = await this.playlistRepo.findOne({ where: { id: playlistId } });
    if (playlist && !playlist.coverImage) {
      await this.playlistRepo.update({ id: playlistId }, { coverImage: song.imageUrl });
    }
  }

    return { ok: true };
  }

  async removeSongFromPlaylist(playlistId: string, spotifyId: string) {
    const song = await this.songRepo.findOne({ where: { spotifyId } });
    if (!song) return { ok: true };

    await this.playlistSongRepo.delete({ playlistId, songId: song.id });
    return { ok: true };
  }

  // LISTENING HISTORY 

  async getListeningHistory(userId: string) {
    const history = await this.historyRepo.find({
      where: { userId },
      relations: ['song'],
      order: { listenedAt: 'DESC' },
      take: 30, // lấy 30 bài gần nhất
    });

    return history.map(h => this.formatSong(h.song)).filter(Boolean);
  }

  async addToHistory(userId: string, songData: any) {
    const song = await this.upsertSong(songData);

    await this.historyRepo.save(
      this.historyRepo.create({ userId, songId: song.id })
    );

    return { ok: true };
  }

  private formatSong(song: Song) {
    if (!song) return null;
    return {
      spotifyId: song.spotifyId,
      title: song.title,
      artist: song.artist,
      album: song.album,
      duration_ms: song.durationMs,
      image_url: song.imageUrl,
      preview_url: song.previewUrl,
      youtubeId: song.youtubeId,
    };
  }
}