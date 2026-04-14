const store = require("./session");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }
  const { sessionId } = req.body || {};
  if (sessionId) await store.clear(sessionId);
  res.json({ ok: true });
};
