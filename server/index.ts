import { app } from "./app";

const port = Number(process.env.PORT || 3000);

export default {
  port,
  fetch: app.fetch,
};

console.log(`🚀 Server running on http://localhost:${port}`);
