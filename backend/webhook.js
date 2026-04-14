const { handleMessage } = require("./handler");
const { sendWhatsAppMessage } = require("./whatsapp");

module.exports = async function handler(req, res) {
  const { VERIFY_TOKEN } = process.env;

  if (req.method === "GET") {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("✅ Webhook verified by Meta.");
      return res.status(200).send(challenge);
    }
    console.warn("❌ Webhook verification failed.");
    return res.status(403).end();
  }

  if (req.method === "POST") {
    const body = req.body;
    if (body?.object !== "whatsapp_business_account") {
      return res.status(404).end();
    }

    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message || message.type !== "text") {
      return res.status(200).end();
    }

    const from = message.from;
    const text = message.text.body.trim();
    console.log(`📨 From ${from}: ${text}`);

    const reply = await handleMessage(from, text);
    await sendWhatsAppMessage(from, reply);

    return res.status(200).end();
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).end();
};
