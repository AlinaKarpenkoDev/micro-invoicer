import {
  Inject,
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Kysely } from 'kysely';
import { Database } from '../database/database';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    @Inject('DB_INSTANCE') private readonly db: Kysely<Database>,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, plainPassword: string) {
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    try {
      const newUser = await this.db
        .insertInto('users')
        .values({
          email: email,
          password_hash: hashedPassword,
          role: 'OWNER',
        })
        .returning(['id', 'email', 'created_at'])
        .executeTakeFirstOrThrow();

      await this.db
        .insertInto('workspaces')
        .values({
          user_id: newUser.id,
          name: 'Мій перший простір',
        })
        .execute();

      return newUser;
    } catch (error: any) {
      const pgError = error as { code?: string };
      if (pgError.code === '23505') {
        throw new ConflictException('Користувач з таким email вже існує!');
      }
      throw error;
    }
  }
  async login(email: string, plainPassword: string) {
    const user = await this.db
      .selectFrom('users')
      .selectAll()
      .where('email', '=', email)
      .executeTakeFirst();

    if (!user) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const isPasswordValid = await bcrypt.compare(
      plainPassword,
      user.password_hash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async impersonateUser(adminId: string, targetUserId: string) {
    const user = await this.db
      .selectFrom('users')
      .select(['id', 'email', 'role'])
      .where('id', '=', targetUserId)
      .executeTakeFirst();

    if (!user) {
      throw new NotFoundException('Сторінку не знайдено');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      is_impersonating: true,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
