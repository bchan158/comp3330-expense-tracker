// server/app.ts
import { Hono } from "hono";
import { logger } from "hono/logger";
import { expensesRoute } from "./routes/expenses";
import { cors } from "hono/cors";
import { authRoute } from "./auth/kinde";
import { secureRoute } from "./routes/secure";
import { uploadRoute } from "./routes/upload";
import { healthRoute } from "./routes/health";
import { serveStatic } from "hono/serve-static";

type Env = {
  Bindings: {
    ASSETS?: {
      fetch: (req: Request) => Promise<Response>;
    };
  };
};

export const app = new Hono<Env>();

// Global logger (from Lab 1)
app.use("*", logger());
app.use(
  "/*",
  serveStatic({
    root: "./server/public",
    getContent: async (path) => {
      try {
        return await Bun.file(`./server/public${path}`).text();
      } catch {
        return null;
      }
    },
  })
);

app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Custom timing middleware
app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  // Add a response header so we can see timings in curl or other clients
  c.header("X-Response-Time", `${ms}ms`);
});

// Health & root
app.get("/", (c) => c.json({ message: "OK" }));
app.get("/health", (c) => c.json({ status: "healthy" }));
app.get("*", async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith("/api")) return next();
  // serve index.html
  return c.env?.ASSETS
    ? await c.env.ASSETS.fetch(new Request("index.html"))
    : c.html(await Bun.file("./server/public/index.html").text());
});

// Mount API routes
app.route("/api/expenses", expensesRoute);
app.route("/api/auth", authRoute);
app.route("/api/secure", secureRoute);
app.route("/api/upload", uploadRoute);
app.route("/health", healthRoute);

export default app;
