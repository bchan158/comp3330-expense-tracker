import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/serve-static";
import { expensesRoute } from "./routes/expenses";
import { authRoute } from "./auth/kinde";
import { secureRoute } from "./routes/secure";
import { uploadRoute } from "./routes/upload";
import { healthRoute } from "./routes/health";
import { cors } from "hono/cors";

export const app = new Hono();

// Logger
app.use("*", logger());

// CORS for API routes
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Serve API routes
app.route("/api/expenses", expensesRoute);
app.route("/api/auth", authRoute);
app.route("/api/secure", secureRoute);
app.route("/api/upload", uploadRoute);
app.route("/health", healthRoute);

// Serve frontend static files
app.use(
  "/*",
  serveStatic({
    root: "./server/public",
    getContent: async (path) => {
      try {
        // If requesting a folder, default to index.html
        const filePath = path === "/" ? "/index.html" : path;
        return await Bun.file(`./server/public${filePath}`).text();
      } catch {
        // fallback to index.html for SPA routes
        return await Bun.file("./server/public/index.html").text();
      }
    },
  })
);

export default app;
