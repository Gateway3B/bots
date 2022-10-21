import { NestFactory } from '@nestjs/core';
import { ResponderModule } from './responder.module';

async function bootstrap() {
  const app = await NestFactory.create(ResponderModule);
  await app.listen(3000);
}
bootstrap();
