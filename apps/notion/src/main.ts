import { NestFactory } from '@nestjs/core';
import { NotionModule } from './notion.module';

async function bootstrap() {
    const app = await NestFactory.create(NotionModule);
    await app.listen(3004);
}
bootstrap();
