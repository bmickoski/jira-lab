import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // (optional) if your frontend calls from a different domain later
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port, "0.0.0.0");

  console.log(`API running on http://0.0.0.0:${port}`);
}

bootstrap();
