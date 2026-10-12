import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import { configureApp } from "./setup";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Railway (and most PaaS) terminate TLS at a proxy; trust it so secure cookies and rate limiting see the real client.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);
  configureApp(app);
  const port = app.get(ConfigService).get<number>("PORT") ?? 4000;
  await app.listen(port, "0.0.0.0");
}
void bootstrap();
