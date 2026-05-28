import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getRevenue(userId: string, role: string, centerId: string) {
    if (role === 'CENTER_ADMIN') {
      // Center admin - faqat o'z markazi uchun
      const payments = await this.prisma.manualExamPayment.findMany({
        where: {
          exam: {
            centerId: centerId,
          },
          status: 'APPROVED',
        },
        include: {
          exam: true,
          user: true,
        },
      });

      const totalRevenue = payments.reduce((sum, p) => sum + (p.exam.priceUzs || 0), 0);

      return {
        totalRevenue,
        paymentCount: payments.length,
        payments: payments.map(p => ({
          id: p.id,
          amount: p.exam.priceUzs,
          examTitle: p.exam.title,
          userName: p.user.name,
          createdAt: p.createdAt,
        })),
      };
    }

    // Super admin - umumiy
    const payments = await this.prisma.manualExamPayment.findMany({
      where: { status: 'APPROVED' },
      include: { exam: true, user: true },
    });

    const totalRevenue = payments.reduce((sum, p) => sum + (p.exam.priceUzs || 0), 0);

    return {
      totalRevenue,
      paymentCount: payments.length,
      payments: payments.map(p => ({
        id: p.id,
        amount: p.exam.priceUzs,
        examTitle: p.exam.title,
        userName: p.user.name,
        centerName: p.user.centerId ? 'Center' : 'Individual',
        createdAt: p.createdAt,
      })),
    };
  }

  async getParticipation(userId: string, role: string, centerId: string) {
    if (role === 'CENTER_ADMIN') {
      // Center admin - faqat o'z markazi uchun
      const results = await this.prisma.result.findMany({
        where: {
          user: {
            centerId: centerId,
          },
        },
        include: {
          user: true,
          exam: true,
        },
      });

      return {
        totalParticipants: results.length,
        results: results.map(r => ({
          id: r.id,
          userName: r.user.name,
          examTitle: r.exam.title,
          score: r.score,
          cefrLevel: r.cefrLevel,
          completedAt: r.completedAt,
        })),
      };
    }

    // Super admin - umumiy
    const results = await this.prisma.result.findMany({
      include: {
        user: true,
        exam: true,
      },
    });

    return {
      totalParticipants: results.length,
      results: results.map(r => ({
        id: r.id,
        userName: r.user.name,
        examTitle: r.exam.title,
        score: r.score,
        cefrLevel: r.cefrLevel,
        centerName: r.user.centerId ? 'Center' : 'Individual',
        completedAt: r.completedAt,
      })),
    };
  }

  async getCentersReport() {
    const centers = await this.prisma.center.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    const centersWithStats = await Promise.all(
      centers.map(async (center) => {
        // Har bir markaz uchun mock topshirganlar soni
        const results = await this.prisma.result.findMany({
          where: {
            user: {
              centerId: center.id,
            },
          },
        });

        // Har bir markaz uchun pul topgan
        const payments = await this.prisma.manualExamPayment.findMany({
          where: {
            exam: {
              centerId: center.id,
            },
            status: 'APPROVED',
          },
          include: {
            exam: true,
          },
        });

        const totalRevenue = payments.reduce((sum, p) => sum + (p.exam.priceUzs || 0), 0);

        return {
          id: center.id,
          name: center.name,
          studentCount: center._count.users,
          mockLimit: (center as any).mockLimit || 100,
          examsTaken: results.length,
          totalRevenue,
          createdAt: center.createdAt,
        };
      }),
    );

    return centersWithStats;
  }
}
