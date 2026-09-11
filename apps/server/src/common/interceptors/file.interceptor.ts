import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { Observable } from "rxjs";

@Injectable()
export class FileInterceptor implements NestInterceptor {
  public intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<any> {
    const req: FastifyRequest = context.switchToHttp().getRequest();

    if (!req.isMultipart() || !req.file) {
      throw new BadRequestException("Invalid multipart content type");
    }

    return next.handle();
  }
}
