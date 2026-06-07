import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: { email: string; password: string; name: string; centerId?: string; phone?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email.toLowerCase().trim() } });
    if (existing) throw new ConflictException('Bu email allaqachon ro\'yxatdan o\'tgan');

    // If centerId is provided, verify it exists
    if (dto.centerId) {
      const center = await this.prisma.center.findUnique({ where: { id: dto.centerId } });
      if (!center) throw new BadRequestException('Noto\'g\'ri markaz ID');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        password: hashedPassword,
        name: dto.name,
        centerId: dto.centerId,
        phone: dto.phone,
        role: 'STUDENT',
        emailVerified: true,
      },
    });

    await this.prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
    });

    await this.prisma.analytics.create({
      data: { userId: user.id },
    });

    return this.generateToken(user);
  }

  async login(dto: { email: string; password: string }) {
    try {
      const email = dto.email.toLowerCase().trim();
      console.log('[AUTH] Login attempt:', email);
      
      const user = await this.prisma.user.findFirst({
        where: { 
          email: {
            equals: email,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
          password: true,
          centerId: true,
        },
      });
      
      console.log('[AUTH] User found:', !!user);

      if (!user) {
        const allUsers = await this.prisma.user.findMany({ 
          select: { email: true, role: true } 
        });
        console.log('[AUTH] All users in DB:', allUsers);
        throw new UnauthorizedException('Foydalanuvchi topilmadi');
      }

      if (!user.password) {
        throw new UnauthorizedException('Bu akkaunt Google orqali ro\'yxatdan o\'tgan');
      }

      const isPasswordValid = await bcrypt.compare(dto.password, user.password);
      console.log('[AUTH] Password valid:', isPasswordValid);
      
      if (!isPasswordValid) {
        throw new UnauthorizedException('Parol noto\'g\'ri');
      }

      return this.generateToken(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      console.error('[AUTH] Login error:', error);
      throw error;
    }
  }

  async googleLogin(dto: { sub: string; email: string; name: string }) {
    if (!dto.sub || !dto.email || !dto.name) {
      throw new BadRequestException('sub, email, and name are required');
    }

    const byGoogle = await this.prisma.user.findUnique({ where: { googleId: dto.sub } });
    if (byGoogle) return this.generateToken(byGoogle);

    const byEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (byEmail) {
      const updated = await this.prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: dto.sub, emailVerified: true },
      });
      return this.generateToken(updated);
    }

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        googleId: dto.sub,
        password: null,
        emailVerified: true,
      },
    });

    await this.prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
    });
    await this.prisma.analytics.create({ data: { userId: user.id } });

    return this.generateToken(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    const generic = { message: 'If that email is registered, password reset instructions were sent.' };

    if (!user || !user.password) {
      return generic;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.passwordResetToken.deleteMany({ where: { email } });
    await this.prisma.passwordResetToken.create({
      data: { email, token, expiresAt },
    });

    const devHint =
      process.env.NODE_ENV !== 'production'
        ? { resetToken: token, expiresAt }
        : {};

    return { ...generic, ...devHint };
  }

  async resetPassword(dto: { token: string; password: string }) {
    const record = await this.prisma.passwordResetToken.findUnique({ where: { token: dto.token } });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(dto.password, 12);
    await this.prisma.user.update({
      where: { email: record.email },
      data: { password: hashed },
    });
    await this.prisma.passwordResetToken.delete({ where: { token: dto.token } });

    return { message: 'Password updated. You can sign in with your new password.' };
  }

  private generateToken(user: { id: string; email: string; name: string; role: string; avatar?: string | null; centerId?: string | null }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        centerId: user.centerId,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        xp: true,
        streak: true,
        createdAt: true,
      },
    });
    return user;
  }
}
