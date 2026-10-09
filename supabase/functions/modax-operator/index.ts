import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: { id?: number | string; type?: string };
    from?: { id?: number | string; username?: string };
  };
};

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
const MODAX_OWNER_CHAT_ID = Deno.env.get("MODAX_OWNER_CHAT_ID");
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-5.6-luna";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SECRET_KEYS = Deno.env.get("SUPABASE_SECRET_KEYS");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function logEvent(update: TelegramUpdate) {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEYS) return;

  await fetch(`${SUPABASE_URL}/rest/v1/operator_events`, {
    method: "POST",
    headers: {
      apikey: JSON.parse(SUPABASE_SECRET_KEYS).default,
      Authorization: `Bearer ${JSON.parse(SUPABASE_SECRET_KEYS).default}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      source: "telegram",
      event_type: "message",
      external_id: String(update.update_id ?? ""),
      // Store only non-content metadata; do not persist the full private Telegram message.
      payload: { chat_type: update.message?.chat?.type ?? null },
    }),
  });
}

async function telegramSendMessage(chatId: string, text: string) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  const response = await fetch(
    `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        disable_web_page_preview: true,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`Telegram sendMessage failed: ${await response.text()}`);
  }
}

async function askOpenAI(text: string) {
  if (!OPENAI_API_KEY) {
    return "The MODAX operator is connected, but its AI key is not configured yet.";
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: [
        {
          role: "system",
          content:
            "You are the MODAX AI Operator. You are an internal business operations assistant. " +
            "For now you may observe, explain, summarize, and recommend. Never claim that you executed " +
            "a production action. Never delete users, change pricing, alter authentication, modify the database, " +
            "or deploy code. If an action would require production access, clearly say it needs human approval.",
        },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    console.error("OpenAI error:", await response.text());
    return "I received the message, but the AI service returned an error. Please check the operator logs.";
  }

  const data = await response.json();
  return data.output_text ?? "I could not produce a response.";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  if (!TELEGRAM_WEBHOOK_SECRET) {
    return json({ error: "Operator webhook secret is not configured." }, 503);
  }

  const contentLength = Number(req.headers.get("content-length") || "0");
  if (contentLength > 32_768) return json({ error: "Request too large." }, 413);

  const incomingSecret = req.headers.get("x-telegram-bot-api-secret-token");
  if (incomingSecret !== TELEGRAM_WEBHOOK_SECRET) {
    return json({ error: "Unauthorized." }, 401);
  }

  if (!MODAX_OWNER_CHAT_ID) {
    // Fail closed: without the explicit owner-chat allowlist this operator must not
    // answer arbitrary Telegram chats.
    return json({ error: "Operator owner-chat lock is not configured." }, 503);
  }

  let update: TelegramUpdate;
  try {
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > 32_768) {
      return json({ error: "Request too large." }, 413);
    }
    update = JSON.parse(rawBody);
    if (!update || typeof update !== "object" || Array.isArray(update)) {
      return json({ error: "Invalid update." }, 400);
    }
  } catch {
    return json({ error: "Invalid JSON." }, 400);
  }

  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim();

  if (chatId === undefined || !text) return json({ ok: true });
  if (text.length > 4000) return json({ error: "Message too long." }, 413);

  if (String(chatId) !== String(MODAX_OWNER_CHAT_ID)) {
    return json({ ok: true });
  }

  try {
    await logEvent(update);

    if (text === "/start" || text === "/help") {
      await telegramSendMessage(
        String(chatId),
        "MODAX AI Operator is connected.\n\n" +
          "Current permissions: observe, summarize, reply, and recommend.\n" +
          "Production changes still require human approval.\n\n" +
          "Try: /status",
      );
      return json({ ok: true });
    }

    if (text === "/status") {
      const configured = [
        ["Telegram bot", Boolean(TELEGRAM_BOT_TOKEN)],
        ["Owner chat lock", Boolean(MODAX_OWNER_CHAT_ID)],
        ["OpenAI", Boolean(OPENAI_API_KEY)],
        ["Supabase logging", Boolean(SUPABASE_URL && SUPABASE_SECRET_KEYS)],
      ];

      const status = configured
        .map(([name, value]) => `${name}: ${value ? "configured" : "not configured"}`)
        .join("\n");

      await telegramSendMessage(String(chatId), `MODAX Operator status\n\n${status}`);
      return json({ ok: true });
    }

    const answer = await askOpenAI(text);
    await telegramSendMessage(String(chatId), answer);
    return json({ ok: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Operator processing failed." }, 500);
  }
});
