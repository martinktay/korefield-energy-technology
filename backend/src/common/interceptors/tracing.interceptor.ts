import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

/**
 * Distributed tracing interceptor.
 * Propagates or generates a trace ID for every request,
 * attaching it to both the request and response headers.
 */
@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const traceId =
      (request.headers['x-trace-id'] as string) ?? uuidv4();
    const spanId = uuidv4().substring(0, 8);

    request.headers['x-trace-id'] = traceId;
    request.headers['x-span-id'] = spanId;

    response.setHeader('x-trace-id', traceId);
    response.setHeader('x-span-id', spanId);

    return next.handle();
  }
}
