// WhatsApp + Claude AI Bot
// -------------------------------------------------
// Bu server:
// 1. WhatsApp Cloud API-dən gələn mesajları qəbul edir (webhook)
// 2. Mesajı Claude API-yə göndərir və cavab alır
// 3. Cavabı istifadəçiyə WhatsApp üzərindən geri göndərir
// -------------------------------------------------

const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();
app.use(express.json());

const {
  VERIFY_TOKEN,          // Meta webhook doğrulama tokeni (özün seçirsən)
  WHATSAPP_TOKEN,        // Meta developer panelindən alınan access token
  PHONE_NUMBER_ID,       // Meta WhatsApp nömrə ID-si
  ANTHROPIC_API_KEY,     // Anthropic Console-dan alınan API açarı
  SYSTEM_PROMPT,         // AI-nin necə danışacağına dair təlimat (aşağıda izah olunub)
  PORT = 3000,
} = process.env;

// Hər istifadəçi üçün son mesajları yaddaşda saxlayırıq (sadə versiya - production üçün DB tövsiyə olunur)
const conversationHistory = new Map();
const MAX_HISTORY = 10; // son neçə mesajı yadda saxlasın

// -------------------------------------------------
// 1) WEBHOOK DOĞRULAMA (Meta ilk qoşulanda bunu çağırır)
// -------------------------------------------------
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("Webhook doğrulandı ✅");
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// -------------------------------------------------
// 2) GƏLƏN MESAJLARIN QƏBULU
// -------------------------------------------------
app.post("/webhook", async (req, res) => {
  // WhatsApp-a dərhal 200 qaytarmaq lazımdır, yoxsa təkrar-təkrar göndərir
  res.sendStatus(200);

  // DİAQNOSTİKA: hər gələn sorğunu tam loglayırıq ki, problemi tapaq
  console.log("=== Webhook POST alındı ===");
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const message = change?.value?.messages?.[0];

    if (!message) {
      console.log("Mesaj tapılmadı (status yeniləməsi ola bilər)");
      return;
    }

    const from = message.from; // göndərənin nömrəsi
    const text = message.text?.body;

    if (!text) {
      await sendWhatsAppMessage(from, "Hazırda yalnız mətn mesajlarını anlaya bilirəm 🙂");
      return;
    }

    console.log(`Gələn mesaj (${from}): ${text}`);

    const reply = await getClaudeReply(from, text);
    await sendWhatsAppMessage(from, reply);
  } catch (err) {
    console.error("Webhook emalında xəta:", err.response?.data || err.message);
  }
});

// -------------------------------------------------
// 3) CLAUDE API-DƏN CAVAB ALMAQ
// -------------------------------------------------
async function getClaudeReply(userId, userText) {
  const history = conversationHistory.get(userId) || [];
  history.push({ role: "user", content: userText });

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: SYSTEM_PROMPT || "Sən dost canlısı, qısa və köməkçi bir WhatsApp asistentisən. Azərbaycan dilində cavab ver.",
      messages: history,
    },
    {
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
    }
  );

  const replyText = response.data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join("\n");

  history.push({ role: "assistant", content: replyText });
  // yaddaşı məhdud saxla
  conversationHistory.set(userId, history.slice(-MAX_HISTORY * 2));

  return replyText;
}

// -------------------------------------------------
// 4) WHATSAPP-A CAVAB GÖNDƏRMƏK
// -------------------------------------------------
async function sendWhatsAppMessage(to, text) {
  await axios.post(
    `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
}

app.get("/", (req, res) => res.send("WhatsApp AI Bot işləyir ✅"));

app.listen(PORT, () => console.log(`Server ${PORT} portunda işə düşdü`));
