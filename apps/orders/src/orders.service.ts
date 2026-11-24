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
  CreateOrderDto,
  UpdateOrderDto,
} from '@app/contracts';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject('USERS_SERVICE')
    private readonly usersClient: ClientProxy,

    @Inject('NOTIFICATIONS_CLIENT')
    private readonly notificationsClient: ClientProxy,
  ) {}

  async create(data: CreateOrderDto) {
    // Consulta o microserviço de usuários
    let user: unknown;

    try {
      user = await firstValueFrom(
        this.usersClient
          .send('users.findOne', data.userId)
          .pipe(timeout(3000)),
      );
    } catch (error) {
      // O usuário informado não existe
      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        error.statusCode === 404
      ) {
        throw new RpcException({
          statusCode: 404,
          message: 'Usuário não encontrado',
        });
      }

      // O microserviço demorou demais para responder
      if (error instanceof TimeoutError) {
        throw new RpcException({
          statusCode: 504,
          message: 'Tempo limite excedido ao consultar usuários',
        });
      }

      // Outra falha na comunicação com Users
      throw new RpcException({
        statusCode: 502,
        message: 'Falha ao consultar o serviço de usuários',
      });
    }

    if (!user) {
      throw new RpcException({
        statusCode: 404,
        message: 'Usuário não encontrado',
      });
    }

    // Persiste o pedido no banco de Orders
    const order = await this.prisma.order.create({
      data: {
        userId: data.userId,
        description: data.description,
        total: data.total,
      },
    });

    // Publica o evento de criação do pedido no RabbitMQ
    await firstValueFrom(
      this.notificationsClient.emit(
        'order.created',
        {
          orderId: order.id,
          userId: order.userId,
          total: order.total.toString(),
        },
      ),
    );

    return order;
  }


  findAll() {
    return this.prisma.order.findMany();
  }


  findByUser(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
    });
  }

  findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
    });
  }

  update(id: number, data: UpdateOrderDto) {
    return this.prisma.order.update({
      where: { id },
      data,
    });
  }

  remove(id: number) {
    return this.prisma.order.delete({
      where: { id },
    });
  }
}
