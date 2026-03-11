import {
  Entity, Column, PrimaryGeneratedColumn,
  CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn
} from 'typeorm';
import { User } from '../users/user.entity';
import { Song } from '../music/song.entity';

// PLaylist
@Entity('playlists')
export class Playlist {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', nullable: true })
    userId: string;

    @Column({ length: 255 })
    name: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ name: 'is_public', default: false })
    isPublic: boolean;

    @Column({ name: 'cover_image', length: ' text', nullable: true })
    coverImage: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}

// Playlis Songs
@Entity('playlist_songs')
export class PlaylistSong {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'playlist_id', nullable: true })
  playlistId: string;

  @Column({ name: 'song_id', nullable: true })
  songId: string;

  @Column({ nullable: true })
  position: number;

  @CreateDateColumn({ name: 'added_at' })
  addedAt: Date;

  @ManyToOne(() => Song)
  @JoinColumn({ name: 'song_id' })
  song: Song;
}

// Liked Songs
@Entity('liked_songs')
export class LikedSong {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'song_id', nullable: true })
  songId: string;

  @CreateDateColumn({ name: 'liked_at' })
  likedAt: Date;

  @ManyToOne(() => Song)
  @JoinColumn({ name: 'song_id' })
  song: Song;
}

// Listening history
@Entity('listening_history')
export class ListeningHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'song_id', nullable: true })
  songId: string;

  @CreateDateColumn({ name: 'listened_at' })
  listenedAt: Date;

  @Column({ name: 'duration_listened', nullable: true })
  durationListened: number;

  @ManyToOne(() => Song)
  @JoinColumn({ name: 'song_id' })
  song: Song;
}