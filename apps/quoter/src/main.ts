import { NestFactory } from '@nestjs/core';
import { QuoterModule } from './quoter.module';

async function bootstrap() {
    const app = await NestFactory.create(QuoterModule);
    await app.listen(3000);
}
bootstrap();
