export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === env.VERIFY_TOKEN && challenge) {
        return new Response(challenge, { status: 200 });
      }

      return new Response("Neloy Social Auto Reply webhook is running", { status: 200 });
    }

    if (request.method === "POST") {
      try {
        const body = await request.json();
        console.log("Webhook received from", body.object || "unknown");

        if (body.object === "page") {
          await handleFacebookMessenger(body, env);
        }

        if (body.object === "instagram") {
          await handleInstagramMessenger(body, env);
        }

        return new Response("EVENT_RECEIVED", { status: 200 });
      } catch (error) {
        console.error("Webhook error:", error?.stack || String(error));
        return new Response("EVENT_RECEIVED", { status: 200 });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
};

async function handleFacebookMessenger(body, env) {
  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      if (event.message?.is_echo) continue;

      const senderId = event.sender?.id;
      const userText = event.message?.text?.trim();

      if (senderId && userText) {
        const reply = await generateAIReply(userText, env, "Facebook Messenger");
        await sendFacebookReply(senderId, reply, env.PAGE_ACCESS_TOKEN);
      }
    }
  }
}

async function handleInstagramMessenger(body, env) {
  for (const entry of body.entry || []) {
    for (const event of entry.messaging || []) {
      if (event.message?.is_echo) continue;

      const senderId = event.sender?.id;
      const userText = event.message?.text?.trim();

      if (senderId && userText) {
        if (!env.INSTAGRAM_ACCESS_TOKEN) {
          console.log("INSTAGRAM_ACCESS_TOKEN_MISSING");
          continue;
        }

        const reply = await generateAIReply(userText, env, "Instagram");
        await sendInstagramReply(senderId, reply, env.INSTAGRAM_ACCESS_TOKEN);
      }
    }
  }
}

async function generateAIReply(userText, env, channel) {
  const fallback = `Hi 👋 Thanks for contacting Neloy Digital Solutions.\n\nWe can help with Website Design, Logo/Graphic Design, Video Editing, UI/UX, and AI Automation.\n\nPlease send your project requirement and approximate budget, and our team will guide you with the next step.`;

  if (!env.AI) {
    console.log("AI_BINDING_MISSING");
    return fallback;
  }

  try {
    const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
      messages: [
        {
          role: "system",
          content: `You are the customer assistant for Neloy Digital Solutions replying on ${channel}. Be friendly, professional, concise, and natural. Services: Website Design, Logo Design, Graphic Design, Video Editing, Reels/Motion Graphics, UI/UX, and AI Automation. Reply in the customer's language when practical. Keep replies to 2-5 short sentences. Ask no more than 1-2 useful questions at once. For project enquiries, learn the requirement, approximate budget, and timeline. Never invent prices, discounts, contact details, portfolio links, guarantees, delivery times, payments, approvals, or completed work. If asked for price, explain it depends on scope and ask for the requirement and approximate budget. If asked for a human, say a Neloy Digital Solutions team member can continue the conversation. Do not mention Cloudflare or internal systems.`
        },
        {
          role: "user",
          content: userText.slice(0, 1500)
        }
      ],
      max_tokens: 220,
      temperature: 0.4
    });

    if (typeof result?.response === "string" && result.response.trim()) {
      console.log("AI_REPLY_OK", channel);
      return result.response.trim().slice(0, 1800);
    }

    console.log("AI_EMPTY_RESPONSE", JSON.stringify(result).slice(0, 500));
    return fallback;
  } catch (error) {
    console.error("AI_RUN_ERROR", error?.stack || String(error));
    return fallback;
  }
}

async function sendFacebookReply(recipientId, replyText, pageAccessToken) {
  const token = (pageAccessToken || "").trim();

  const response = await fetch("https://graph.facebook.com/v26.0/me/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text: replyText }
    })
  });

  console.log("Facebook status:", response.status);
  console.log("Facebook reply:", await response.text());
}

async function sendInstagramReply(recipientId, replyText, instagramAccessToken) {
  const token = (instagramAccessToken || "").trim();

  const response = await fetch("https://graph.instagram.com/v26.0/me/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: replyText }
    })
  });

  console.log("Instagram status:", response.status);
  console.log("Instagram reply:", await response.text());
}
