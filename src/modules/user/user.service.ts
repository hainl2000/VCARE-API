import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/shared/prisma.service';
import { CreateUserDto } from './user.dto';
import { generateHashPass } from 'src/utils/_security';
import { Prisma, users } from '@prisma/client';
import {
  checkFieldUpdateUser,
  privateField,
  userField,
} from 'src/constants/type';
import dayjs from 'dayjs';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    try {
      const { email, phone } = data;
      const existed = await this.prisma.users.findFirst({
        where: { OR: [{ email }, { phone }] },
      });

      if (!!existed) {
        throw new BadRequestException('Email/SĐT đã tồn tại trên hệ thống');
      }

      data.password = generateHashPass(data.password);

      return await this.prisma.users.create({ data });
    } catch (error) {
      throw error;
    }
  }

  async findUserByUserName(username: string) {
    try {
      const user = await this.prisma.users.findFirst({
        where: { OR: [{ phone: username }, { email: username }] },
      });

      if (!user) {
        throw new NotFoundException('Không tồn tại tài khoản này');
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  async update(
    target: users | number,
    data: Prisma.XOR<Prisma.usersUpdateInput, Prisma.usersUncheckedUpdateInput>,
  ) {
    let user: users;
    if (typeof target === 'number') {
      user = await this.prisma.users.findUnique({ where: { id: target } });
    } else user = target;
    const log = Object.keys(data).reduce(
      (pre: Record<string, any>, key: userField) => {
        if (checkFieldUpdateUser.includes(key) && user[key] !== data[key]) {
          pre[key] = `${user[key]} -> ${data[key]}`;
        }
        return pre;
      },
      {
        time: dayjs().valueOf(),
      },
    );
    if (Object.keys(log).length > 1) {
      data.change_history = (user.change_history as Prisma.JsonArray).push(log);
    }
    try {
      const result = await this.prisma.users.update({
        where: { id: user.id },
        data,
      });

      return this.getUserSafeData(result);
    } catch (error) {
      throw error;
    }
  }

  async findById(id: number) {
    try {
      return await this.prisma.users.findUnique({ where: { id } });
    } catch (error) {
      throw error;
    }
  }

  getUserSafeData(user: users) {
    Object.keys(user).forEach((key: userField) => {
      if (privateField.includes(key)) {
        delete user[key];
      }
    });

    return user;
  }
}
