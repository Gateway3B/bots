import { NestFactory } from '@nestjs/core';
import { PollerModule } from './poller.module';

async function bootstrap() {
    const app = await NestFactory.create(PollerModule);
    await app.listen(3001);
}
bootstrap();
