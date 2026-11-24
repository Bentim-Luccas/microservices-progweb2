import { Inject, Injectable } from '@nestjs/common';
import {
  ClientProxy,
  RpcException,
} from '@nestjs/microservices';

import {
  firstValueFrom,
  timeout,
  TimeoutError,
} from 'rxjs';


import { PrismaService } from './prisma.service.js';

import {
  CreateUserDto,
  UpdateUserDto,
} from '@app/contracts';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject('ORDERS_SERVICE')
    private readonly ordersClient: ClientProxy,
  ) {}

  create(data: CreateUserDto) {
    return this.prisma.user.create({
      data,
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'Usuário não encontrado',
      });
    }

    return user;
  }

  update(id: number, data: UpdateUserDto) {
    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    let orders: { id: number }[];

    try {
      // Consulta os pedidos associados ao usuário
      orders = await firstValueFrom(
        this.ordersClient
          .send<{ id: number }[]>(
            'orders.findByUser',
            id,
          )
          .pipe(timeout(3000)),
      );
    } catch (error) {
      // O Orders Service demorou demais para responder
      if (error instanceof TimeoutError) {
        throw new RpcException({
          statusCode: 504,
          message: 'Tempo limite excedido ao consultar pedidos',
        });
      }

      // Não permite excluir sem verificar os pedidos
      throw new RpcException({
        statusCode: 502,
        message: 'Falha ao consultar o serviço de pedidos',
      });
    }

    // Impede a exclusão quando existem pedidos
    if (orders.length > 0) {
      throw new RpcException({
        statusCode: 409,
        message: 'Usuário possui pedidos cadastrados',
      });
    }

    // Exclui somente quando não existem pedidos
    return this.prisma.user.delete({
      where: { id },
    });
  }

}