import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Дивимося, чи висить на маршруті мітка VIP-зони (наприклад, ['OWNER'])
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    // 2. Якщо мітки немає — маршрут відкритий для всіх, пускаємо!
    if (!requiredRoles) {
      return true;
    }

    // 3. Дістаємо користувача з запиту (його туди вже поклав перший охоронець - AuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 4. Перевіряємо, чи є роль юзера у списку дозволених ролей для цього маршруту
    return requiredRoles.includes(user.role);
  }
}
