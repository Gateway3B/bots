import { NestFactory } from '@nestjs/core';
import { CraberModule } from './craber.module';

async function bootstrap() {
    const app = await NestFactory.create(CraberModule);
    await app.listen(3000);
}
bootstrap();
