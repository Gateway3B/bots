import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponderService {
  getHello(): string {
    return 'Hello World!';
  }
}
