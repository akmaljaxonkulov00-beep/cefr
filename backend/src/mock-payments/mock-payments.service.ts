import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GroqClientService } from '../ai/groq.client';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class MockPaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly groq: GroqClientService,
    private readonly storage: StorageService,
  ) {}

  async submitCheck(studentId: string, mockPartId: string, checkImageUrl: string) {
    // Check if payment already exists
    const existingPayment = await this.prisma.mockPayment.findFirst({
      where: {
        studentId,
        mockPartId,
        status: { in: ['pending', 'approved'] },
      },
    });

    if (existingPayment) {
      throw new BadRequestException('Siz allaqachon to\'lov yuborgansiz');
    }

    // Get mock part details
    const mockPart = await this.prisma.mockPart.findUnique({
      where: { id: mockPartId },
    });

    if (!mockPart) {
      throw new NotFoundException('Mock part topilmadi');
    }

    // Get active payment card
    const activeCard = await this.prisma.paymentCard.findFirst({
      where: { isActive: true },
    });

    if (!activeCard) {
      throw new BadRequestException('Aktiv to\'lov karta topilmadi');
    }

    // Create payment record
    const payment = await this.prisma.mockPayment.create({
      data: {
        studentId,
        mockPartId,
        amount: mockPart.price,
        checkImageUrl,
        status: 'pending',
      },
    });

    // Trigger AI verification
    this.verifyPaymentWithAI(payment.id, mockPart.price, activeCard.cardNumber, checkImageUrl);

    return payment;
  }

  private async verifyPaymentWithAI(paymentId: string, expectedAmount: number, cardNumber: string, checkImageUrl: string) {
    try {
      // Get last 4 digits of card number
      const last4Digits = cardNumber.slice(-4);

      const system = `Sen to\'lov chek rasmini tahlil qilish ekspertsan. Faqat JSON qaytaring.
{
  "isValid": true/false,
  "confidence": 0-100,
  "amount": "extracted amount or null",
  "reason": "explanation in Uzbek"
}`;

      const user = `Analyze this payment receipt image.
Expected card number last 4 digits: ${last4Digits}
Expected amount: ${expectedAmount} UZS

Check:
1. Is this a valid payment receipt?
2. Does the amount match ${expectedAmount} UZS?
3. Is the card number visible and does it end with ${last4Digits}?

Respond in JSON only:
{
  "isValid": true/false,
  "confidence": 0-100,
  "amount": "extracted amount or null",
  "reason": "explanation in Uzbek"
}`;

      const { parsed, usage, latencyMs, model } = await this.groq.chatJson<any>({
        system,
        user,
        maxTokens: 500,
        temperature: 0.2,
      });

      // Save AI verdict
      await this.prisma.mockPayment.update({
        where: { id: paymentId },
        data: {
          aiVerdict: parsed,
        },
      });

      // Auto-approve if confidence >= 85 and isValid = true
      if (parsed.confidence >= 85 && parsed.isValid) {
        await this.prisma.mockPayment.update({
          where: { id: paymentId },
          data: {
            status: 'approved',
            reviewedAt: new Date(),
          },
        });

        // Send notification (you can implement notification service)
        console.log(`Payment ${paymentId} auto-approved by AI`);
      } else {
        // Mark for manual review
        await this.prisma.mockPayment.update({
          where: { id: paymentId },
          data: {
            status: 'pending_manual',
          },
        });
      }
    } catch (error) {
      console.error('AI verification failed:', error);
      // Mark for manual review if AI fails
      await this.prisma.mockPayment.update({
        where: { id: paymentId },
        data: {
          status: 'pending_manual',
        },
      });
    }
  }

  async checkAccess(studentId: string, mockPartId: string) {
    // Get mock part
    const mockPart = await this.prisma.mockPart.findUnique({
      where: { id: mockPartId },
    });

    if (!mockPart) {
      throw new NotFoundException('Mock part topilmadi');
    }

    // If free, allow access
    if (mockPart.price === 0) {
      return { hasAccess: true, reason: 'free' };
    }

    // Check for approved payment
    const approvedPayment = await this.prisma.mockPayment.findFirst({
      where: {
        studentId,
        mockPartId,
        status: 'approved',
      },
    });

    if (approvedPayment) {
      return { hasAccess: true, reason: 'paid' };
    }

    // Check for pending payment
    const pendingPayment = await this.prisma.mockPayment.findFirst({
      where: {
        studentId,
        mockPartId,
        status: { in: ['pending', 'pending_manual'] },
      },
    });

    if (pendingPayment) {
      return { hasAccess: false, reason: 'pending' };
    }

    // Check for rejected payment
    const rejectedPayment = await this.prisma.mockPayment.findFirst({
      where: {
        studentId,
        mockPartId,
        status: 'rejected',
      },
    });

    if (rejectedPayment) {
      return { hasAccess: false, reason: 'rejected', rejectionReason: rejectedPayment.rejectionReason };
    }

    return { hasAccess: false, reason: 'not_paid' };
  }

  async getPendingPayments() {
    return this.prisma.mockPayment.findMany({
      where: {
        status: { in: ['pending', 'pending_manual'] },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(paymentId: string, status: string, reason?: string, reviewerId?: string) {
    const payment = await this.prisma.mockPayment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('To\'lov topilmadi');
    }

    return this.prisma.mockPayment.update({
      where: { id: paymentId },
      data: {
        status,
        rejectionReason: reason,
        reviewedAt: new Date(),
        reviewerId,
      },
    });
  }

  async getStudentPaymentHistory(studentId: string) {
    return this.prisma.mockPayment.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
