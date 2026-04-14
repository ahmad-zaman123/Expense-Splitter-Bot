const { handleMessage } = require("./handler");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const { sessionId, text } = req.body || {};
  if (!sessionId || typeof text !== "string") {
    return res.status(400).json({ error: "sessionId and text are required" });
  }
  const reply = await handleMessage(sessionId, text);
  res.json({ reply });
};
