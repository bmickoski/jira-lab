import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cookieParser from "cookie-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Add cookie parser middleware
  app.use(cookieParser());

  // (optional) if your frontend calls from a different domain later
  app.enableCors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port, "0.0.0.0");

  console.log(`API running on http://0.0.0.0:${port}`);
}

bootstrap();
