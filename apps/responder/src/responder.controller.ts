import { Controller, Get } from '@nestjs/common';
import { ResponderService } from './responder.service';

@Controller()
export class ResponderController {
  constructor(private readonly responderService: ResponderService) {}

  @Get()
  getHello(): string {
    return this.responderService.getHello();
  }
}
