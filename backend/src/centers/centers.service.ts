import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class CentersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.center.findMany({
      where: { id: { not: undefined } },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.center.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
  }

  async create(dto: { name: string; address?: string; mockLimit?: number; adminEmail?: string; adminPassword?: string }) {
    return this.prisma.center.create({ 
      data: {
        name: dto.name,
        address: dto.address,
        mockLimit: dto.mockLimit || 100,
        adminEmail: dto.adminEmail,
        adminPassword: dto.adminPassword,
      }
    });
  }

  async assignUser(centerId: string, userId: string) {
    await this.prisma.center.findUniqueOrThrow({ where: { id: centerId } });
    return this.prisma.user.update({
      where: { id: userId },
      data: { centerId },
      select: { id: true, name: true, email: true, centerId: true },
    });
  }

  async createCenterAdmin(centerId: string, dto: { email: string; password: string; name: string }) {
    const center = await this.prisma.center.findUniqueOrThrow({ where: { id: centerId } });
    
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        centerId: centerId,
        role: 'CENTER_ADMIN',
      },
    });

    await this.prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', status: 'ACTIVE' },
    });

    await this.prisma.analytics.create({
      data: { userId: user.id },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      centerId: user.centerId,
      centerName: center.name,
    };
  }

  async remove(id: string) {
    await this.prisma.user.updateMany({ where: { centerId: id }, data: { centerId: null } });
    await this.prisma.center.delete({ where: { id } });
    return { ok: true };
  }

  async getCenterLimit(id: string) {
    const center = await this.prisma.center.findUnique({
      where: { id },
      select: { id: true, name: true, mockLimit: true }
    });
    return center;
  }

  async updateLimit(id: string, mockLimit: number) {
    return this.prisma.center.update({
      where: { id },
      data: { mockLimit } as any,
    });
  }

  async update(id: string, dto: { name?: string; address?: string; phone?: string; email?: string; mockLimit?: number; adminPassword?: string; paymentInstructions?: string }) {
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.email !== undefined) updateData.email = dto.email;
    if (dto.mockLimit !== undefined) updateData.mockLimit = dto.mockLimit;
    if (dto.adminPassword !== undefined) updateData.adminPassword = dto.adminPassword;
    if (dto.paymentInstructions !== undefined) updateData.paymentInstructions = dto.paymentInstructions;

    return this.prisma.center.update({
      where: { id },
      data: updateData,
    });
  }

  async toggleVip(id: string, isVip: boolean) {
    return this.prisma.center.update({
      where: { id },
      data: { isVip },
    });
  }
}
