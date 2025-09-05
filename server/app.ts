import { Hono } from "hono";
import { logger } from "hono/logger";

export const app = new Hono();

app.use("*", logger());

app.get("/", (c) => c.json({ message: "OK" }));
app.get("/health", (c) => c.json({ status: "healthy" }));
app.get("/api/test", (c) => c.json({ message: "test" }));
