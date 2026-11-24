import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import type { Response } from 'express';

import { TimeoutError } from 'rxjs';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host
      .switchToHttp()
      .getResponse<Response>();

    // Preserva os erros HTTP gerados pelo Gateway
    if (exception instanceof HttpException) {
      return response
        .status(exception.getStatus())
        .json(exception.getResponse());
    }


    // Trata o tempo limite das chamadas aos microserviços
    if (exception instanceof TimeoutError) {
      return response
        .status(HttpStatus.GATEWAY_TIMEOUT)
        .json({
          statusCode: HttpStatus.GATEWAY_TIMEOUT,
          message: 'Tempo limite excedido na comunicação com o microserviço',
        });
    }

    // Verifica se o erro RPC possui statusCode
    if (
      typeof exception === 'object' &&
      exception !== null &&
      'statusCode' in exception &&
      typeof exception.statusCode === 'number' &&
      exception.statusCode >= 400 &&
      exception.statusCode <= 599
    ) {
      const message =
        'message' in exception &&
        typeof exception.message === 'string'
          ? exception.message
          : 'Erro na comunicação entre serviços';

      return response.status(exception.statusCode).json({
        statusCode: exception.statusCode,
        message,
      });
    }

    // Trata erros não reconhecidos
    return response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
      });
  }
}
