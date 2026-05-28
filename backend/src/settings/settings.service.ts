import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    let settings = await this.prisma.siteSettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.siteSettings.create({
        data: {
          siteName: 'MockCEFR',
          siteDescription: 'CEFR va IELTS mock test platformasi',
          contactEmail: 'info@mockcefr.uz',
          contactPhone: '+998 90 123 45 67',
          pricing: {
            cefrMockPrice: 50000,
            ieltsMockPrice: 70000,
          },
          examSettings: {
            defaultTimeLimit: 120,
            maxAttempts: 3,
            autoSubmitOnTimeout: true,
          },
          maintenanceMode: false,
        },
      });
    }

    return {
      id: settings.id,
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      contactEmail: settings.contactEmail,
      contactPhone: settings.contactPhone,
      pricing: settings.pricing,
      examSettings: settings.examSettings,
      paymentInstructions: settings.paymentInstructions,
      maintenanceMode: settings.maintenanceMode,
    };
  }

  async update(dto: any) {
    const settings = await this.prisma.siteSettings.findFirst();
    
    if (!settings) {
      return this.prisma.siteSettings.create({
        data: dto,
      });
    }

    const updateData: any = {
      siteName: dto.siteName,
      siteDescription: dto.siteDescription,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      pricing: dto.pricing,
      examSettings: dto.examSettings,
      maintenanceMode: dto.maintenanceMode,
    };

    if (dto.paymentInstructions !== undefined) {
      updateData.paymentInstructions = dto.paymentInstructions;
    }

    return this.prisma.siteSettings.update({
      where: { id: settings.id },
      data: updateData,
    });
  }

  async getPricing() {
    const settings = await this.prisma.siteSettings.findFirst();
    
    if (!settings) {
      const defaultSettings = await this.prisma.siteSettings.create({
        data: {
          siteName: 'MockCEFR',
          siteDescription: 'CEFR va IELTS mock test platformasi',
          contactEmail: 'info@mockcefr.uz',
          contactPhone: '+998 90 123 45 67',
          pricing: {
            cefrMockPrice: 50000,
            ieltsMockPrice: 70000,
          },
          examSettings: {
            defaultTimeLimit: 120,
            maxAttempts: 3,
            autoSubmitOnTimeout: true,
          },
          maintenanceMode: false,
        },
      });
      const pricing = defaultSettings.pricing as any;
      return {
        mockCefrUzs: pricing.cefrMockPrice || 50000,
        mockIeltsUzs: pricing.ieltsMockPrice || 70000,
        readingUzs: pricing.readingUzs || 0,
        listeningUzs: pricing.listeningUzs || 0,
        writingUzs: pricing.writingUzs || 0,
        speakingUzs: pricing.speakingUzs || 0,
      };
    }

    const pricing = settings.pricing as any;
    return {
      mockCefrUzs: pricing.cefrMockPrice || 50000,
      mockIeltsUzs: pricing.ieltsMockPrice || 70000,
      readingUzs: pricing.readingUzs || 0,
      listeningUzs: pricing.listeningUzs || 0,
      writingUzs: pricing.writingUzs || 0,
      speakingUzs: pricing.speakingUzs || 0,
    };
  }

  async updatePricing(dto: any) {
    const settings = await this.prisma.siteSettings.findFirst();
    
    // Convert frontend field names to backend field names
    const pricingDto = {
      cefrMockPrice: dto.mockCefrUzs,
      ieltsMockPrice: dto.mockIeltsUzs,
      readingUzs: dto.readingUzs,
      listeningUzs: dto.listeningUzs,
      writingUzs: dto.writingUzs,
      speakingUzs: dto.speakingUzs,
    };
    
    if (!settings) {
      return this.prisma.siteSettings.create({
        data: {
          pricing: pricingDto,
        },
      });
    }

    const currentPricing = settings.pricing as any || {};
    const newPricing = {
      ...currentPricing,
      ...pricingDto,
    };

    return this.prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        pricing: newPricing,
      },
    });
  }

  async getPaymentCards() {
    return this.prisma.paymentCard.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPaymentCard(dto: any) {
    const { cardNumber, cardHolderName, bankName, cardType, isActive } = dto;

    // If setting as active, deactivate all other cards
    if (isActive) {
      await this.prisma.paymentCard.updateMany({
        data: { isActive: false },
      });
    }

    return this.prisma.paymentCard.create({
      data: {
        cardNumber,
        cardHolderName,
        bankName,
        cardType,
        isActive: isActive || false,
      },
    });
  }

  async updatePaymentCard(id: string, dto: any) {
    const { cardNumber, cardHolderName, bankName, cardType, isActive } = dto;

    // If setting as active, deactivate all other cards
    if (isActive) {
      await this.prisma.paymentCard.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }

    return this.prisma.paymentCard.update({
      where: { id },
      data: {
        ...(cardNumber !== undefined && { cardNumber }),
        ...(cardHolderName !== undefined && { cardHolderName }),
        ...(bankName !== undefined && { bankName }),
        ...(cardType !== undefined && { cardType }),
        ...(isActive !== undefined && { isActive }),
      },
    });
  }

  async deletePaymentCard(id: string) {
    await this.prisma.paymentCard.delete({
      where: { id },
    });
  }

  async getActivePaymentCard() {
    return this.prisma.paymentCard.findFirst({
      where: { isActive: true },
    });
  }
}
