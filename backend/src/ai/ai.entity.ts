import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn
} from 'typeorm';

// CHAT_HISTORY 
@Entity('chat_history')
export class ChatHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 20 })
  role: string; // 'user' | 'ai'

  @Column({ type: 'text' })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// USER_MOODS
@Entity('user_moods')
export class UserMood {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ length: 100 })
  mood: string;

  @Column({ name: 'context_text', type: 'text', nullable: true })
  contextText: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}