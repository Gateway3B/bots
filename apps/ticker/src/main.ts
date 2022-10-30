import { NestFactory } from '@nestjs/core';
import { TickerModule } from './ticker.module';

async function bootstrap() {
    const app = await NestFactory.create(TickerModule);
    await app.listen(3002);
}
bootstrap();
