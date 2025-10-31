import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun"; // ← Changed this line
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
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://comp3330-expense-tracker.onrender.com",
    ],
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
app.use("/*", serveStatic({ root: "./server/public" }));

// SPA fallback - serve index.html for routes that don't match files
app.get("*", serveStatic({ path: "./server/public/index.html" }));

export default app;
