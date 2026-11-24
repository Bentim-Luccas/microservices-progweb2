
import {
  ArgumentsHost,
  Catch,
  HttpException,
  RpcExceptionFilter,
} from '@nestjs/common';

import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class AllRpcExceptionsFilter
  implements RpcExceptionFilter<unknown>
{
  catch(
    exception: unknown,
    _host: ArgumentsHost,
  ): Observable<never> {

    // Preserva os erros RPC com statusCode válido
    if (exception instanceof RpcException) {
      const error = exception.getError();

      if (
        typeof error === 'object' &&
        error !== null &&
        'statusCode' in error &&
        typeof error.statusCode === 'number' &&
        error.statusCode >= 400 &&
        error.statusCode <= 599
      ) {
        return throwError(() => error);
      }

      return throwError(() => ({
        statusCode: 500,
        message:
          typeof error === 'string'
            ? error
            : 'Erro RPC não identificado',
      }));
    }

    // Converte exceções HTTP em erros RPC
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      const message =
        typeof response === 'string'
          ? response
          : typeof response === 'object' &&
              response !== null &&
              'message' in response
            ? response.message
            : exception.message;

      return throwError(() => ({
        statusCode: exception.getStatus(),
        message,
      }));
    }

    // Não expõe detalhes de erros inesperados
    return throwError(() => ({
      statusCode: 500,
      message: 'Erro interno do microserviço',
    }));
  }
}
