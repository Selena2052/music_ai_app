import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(email: string, username: string, password: string) {
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const user = await this.usersService.create({
      email,
      username,
      password: hashedPassword,
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      token,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return {
      token,
      user: { id: user.id, email: user.email, username: user.username },
    };
  }

  async updateProfile(userId: string, data: { username?: string; avatar?: string }) {
  await this.usersService.updateProfile(userId, data);
  return this.usersService.findById(userId);
}
}
