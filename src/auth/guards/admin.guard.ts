import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ForbiddenException('Access denied');
    }

    try {
      const decoded = this.jwtService.verify(token);

      if (decoded.role !== 'Admin') {
        throw new ForbiddenException('Access denied');
      }

      return true;
    } catch (error) {
      throw new ForbiddenException('Access denied');
    }
  }
}
