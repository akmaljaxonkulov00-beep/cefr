import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { MockPaymentsService } from '../../mock-payments/mock-payments.service';

@Injectable()
export class MockAccessGuard implements CanActivate {
  constructor(private readonly mockPaymentsService: MockPaymentsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const mockPartId = request.params.id || request.params.mockPartId || request.query.mockPartId;

    if (!mockPartId) {
      return true; // No mockPartId in request, allow access
    }

    try {
      const access = await this.mockPaymentsService.checkAccess(user.userId, mockPartId);

      if (access.hasAccess) {
        return true;
      }

      // Set access info in request for frontend to handle
      request.mockAccess = access;

      if (access.reason === 'rejected') {
        throw new ForbiddenException(`To'lov rad etildi. Sabab: ${access.rejectionReason}. Qayta to'lang.`);
      }

      if (access.reason === 'pending') {
        throw new ForbiddenException('To\'lovingiz tekshirilmoqda. Iltimos, kuting.');
      }

      throw new ForbiddenException('Bu mock uchun to\'lov talab etiladi.');
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      // If mock part doesn't exist, allow access (will be handled by controller)
      return true;
    }
  }
}
