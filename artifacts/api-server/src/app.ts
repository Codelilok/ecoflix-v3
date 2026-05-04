import path from "path";
import express, { type Express } from "express";
import cors from "cors";
import * as pinoHttpModule from "pino-http";
import { createProxyMiddleware } from "http-proxy-middleware";
import router from "./routes";
import { logger } from "./lib/logger";

const pinoHttp = (pinoHttpModule as any).default ?? pinoHttpModule;

const app: Express = express();

app.use(pinoHttp({ logger }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const staticDir = path.resolve(__dirname, "public");

  app.use(express.static(staticDir));

  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  const ecoflixPort = process.env.ECOFLIX_PORT ?? "26124";
  app.use(
    createProxyMiddleware({
      target: `http://localhost:${ecoflixPort}`,
      changeOrigin: true,
      ws: true,
      pathFilter: (path) => !path.startsWith("/api"),
    })
  );
}

export default app;
