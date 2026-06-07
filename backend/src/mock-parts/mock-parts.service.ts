import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MockPartsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: any) {
    const { type, skill, status, page = 1, limit = 10 } = query;
    const where: any = {};

    if (type) where.type = type;
    if (skill) where.skill = skill;
    if (status) where.status = status === 'active' ? 'ACTIVE' : status === 'draft' ? 'DRAFT' : status;

    const [parts, total] = await Promise.all([
      this.prisma.mockPart.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: Number(limit),
      }),
      this.prisma.mockPart.count({ where }),
    ]);

    return {
      parts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const part = await this.prisma.mockPart.findUnique({
      where: { id },
    });

    if (!part) {
      throw new NotFoundException('Mock part topilmadi');
    }

    return part;
  }

  async create(dto: any) {
    const { title, type, skill, partNumber, questions, audioUrl, audioPlaysOnce, passageText, passageFile, price, status } = dto;

    try {
      return this.prisma.mockPart.create({
        data: {
          title,
          type,
          skill,
          partNumber,
          questions: questions || [],
          audioUrl,
          audioPlaysOnce: audioPlaysOnce ?? true,
          passageText,
          passageFile,
          price: price || 0,
          status: status || 'DRAFT',
        },
      });
    } catch (error) {
      console.error('Error creating mock part:', error);
      throw new BadRequestException('Mock part yaratishda xatolik: ' + (error as Error).message);
    }
  }

  async update(id: string, dto: any) {
    const { title, type, skill, partNumber, questions, audioUrl, audioPlaysOnce, passageText, passageFile, price, status } = dto;

    return this.prisma.mockPart.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(skill !== undefined && { skill }),
        ...(partNumber !== undefined && { partNumber }),
        ...(questions !== undefined && { questions }),
        ...(audioUrl !== undefined && { audioUrl }),
        ...(audioPlaysOnce !== undefined && { audioPlaysOnce }),
        ...(passageText !== undefined && { passageText }),
        ...(passageFile !== undefined && { passageFile }),
        ...(price !== undefined && { price }),
        ...(status !== undefined && { status }),
      },
    });
  }

  async delete(id: string) {
    await this.prisma.mockPart.delete({
      where: { id },
    });
  }

  async toggleStatus(id: string, status: string) {
    const part = await this.findOne(id);
    
    return this.prisma.mockPart.update({
      where: { id },
      data: { status: status === 'active' ? 'ACTIVE' : 'DRAFT' },
    });
  }
}
