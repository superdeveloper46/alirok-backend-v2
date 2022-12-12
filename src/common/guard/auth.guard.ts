import { HttpService } from '@nestjs/axios';
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) {
      return true;
    }

    const CORE_API_URL = this.configService.get<string>('CORE_API_URL');
    const CORE_API_HOST = this.configService.get<string>('CORE_API_HOST');

    const request = context.switchToHttp().getRequest();

    const { authorization } = request.headers;

    try {
      const response = await lastValueFrom(
        this.httpService.get(`${CORE_API_URL}/check-token`, {
          headers: {
            Authorization: authorization,
            Host: CORE_API_HOST,
          },
        }),
      );

      request.user = response.data;

      if (roles.includes('admin') && response.data.type !== 'ADMIN') {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
