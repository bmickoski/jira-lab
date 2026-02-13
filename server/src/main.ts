import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://react-entity-picker-lab.vercel.app"
    ]
  });
}
bootstrap();
