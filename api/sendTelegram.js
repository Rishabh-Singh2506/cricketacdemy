// api/sendTelegram.js
// Vercel Serverless Function
// Set these in Vercel Dashboard → Settings → Environment Variables:
//   TELEGRAM_BOT_TOKEN → your bot token from @BotFather  e.g. 123456:ABCdef...
//   TELEGRAM_CHAT_ID   → your chat/group ID             e.g. -1001234567890

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set in environment.");
    return res.status(500).json({ success: false, message: "Telegram not configured" });
  }

  const d = req.body;

  // Build a nicely formatted Telegram message
  const mapLine = d.map && d.map !== "N/A"
    ? `📍 [View Location](${d.map})`
    : "📍 Location: Not available";

  const message = `
🏏 *New Player Registration — StepUp Cricket Academy*

🆔 *Reg No:* \`${d.reg}\`
👤 *Player:* ${d.name} (Age: ${d.age})
👨‍👩‍👦 *Parent:* ${d.parent}
📱 *Phone:* ${d.phone}
🏠 *Address:* ${d.address}
⏰ *Batch:* ${d.timing}
📅 *Date:* ${d.date}
${mapLine}
`.trim();

  try {
    const telegramRes = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "Markdown",
          disable_web_page_preview: false
        })
      }
    );

    const result = await telegramRes.json();

    if (!result.ok) {
      console.error("Telegram API error:", result);
      return res.status(500).json({ success: false, error: result.description });
    }

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error("Telegram fetch failed:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
