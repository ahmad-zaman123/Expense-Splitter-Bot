// Local dev server — mounts the Vercel-style handlers on an Express app
// so you can develop without the Vercel CLI. On Vercel, the files in /api
// are served directly as serverless functions and this file is ignored.

require("dotenv").config();
const express = require("express");
const cors = require("cors");

const webhook = require("./backend/webhook");
const message = require("./backend/message");
const reset = require("./backend/reset");
const health = require("./backend/health");

const app = express();
app.use(cors());
app.use(express.json());

// Vercel passes req.query pre-parsed; Express already does too.
app.all("/api/webhook", webhook);
app.post("/api/message", message);
app.post("/api/reset", reset);
app.get("/api/health", health);

// Backwards-compat with Meta's webhook path
app.all("/webhook", webhook);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dev server on http://localhost:${PORT}`);
  console.log(`📡 Webhook: http://localhost:${PORT}/api/webhook`);
});
