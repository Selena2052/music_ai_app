import { Controller, Post, Body, Patch, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';

class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.username, body.password);
  }

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.authService.login(body.email, body.password);
  }

  @Patch('profile')
  @UseGuards(AuthGuard('jwt')) 
  updateProfile(
    @Request() req,
    @Body('username') username?: string,
    @Body('avatar') avatar?: string,
  ) {
    return this.authService.updateProfile(req.user.userId, { username, avatar })
  }
}
