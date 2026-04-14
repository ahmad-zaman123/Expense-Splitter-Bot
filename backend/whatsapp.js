const axios = require("axios");

async function sendWhatsAppMessage(to, body) {
  const { WHATSAPP_TOKEN, PHONE_NUMBER_ID } = process.env;
  if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
    console.warn("⚠️ WHATSAPP_TOKEN or PHONE_NUMBER_ID not set — skipping send.");
    return;
  }
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body },
      },
      {
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ Reply sent to ${to}`);
  } catch (err) {
    console.error("❌ Failed to send message:", err.response?.data || err.message);
  }
}

module.exports = { sendWhatsAppMessage };
