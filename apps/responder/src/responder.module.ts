import { Module } from '@nestjs/common';
import { ResponderController } from './responder.controller';
import { ResponderService } from './responder.service';

@Module({
  imports: [],
  controllers: [ResponderController],
  providers: [ResponderService],
})
export class ResponderModule {}
