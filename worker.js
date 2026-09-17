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
        console.log("Webhook received");

        if (body.object === "page") {
          for (const entry of body.entry || []) {
            for (const event of entry.messaging || []) {
              if (event.message?.is_echo) continue;

              const senderId = event.sender?.id;
              const userText = event.message?.text?.trim();

              if (senderId && userText) {
                const reply = await generateAIReply(userText, env);
                await sendMessengerReply(senderId, reply, env.PAGE_ACCESS_TOKEN);
              }
            }
          }
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

async function generateAIReply(userText, env) {
  const fallback = `Hi 👋 Thanks for contacting Neloy Digital Solutions.\n\nWe can help with Website Design, Logo/Graphic Design, Video Editing, UI/UX, and AI Automation.\n\nPlease send your project requirement and approximate budget, and our team will guide you with the next step.`;

  if (!env.AI) {
    console.log("AI_BINDING_MISSING");
    return fallback;
  }

  try {
    const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
      messages: [
        {
          role: "system",
          content: `You are the customer assistant for Neloy Digital Solutions. Be friendly, professional, concise, and natural. Services: Website Design, Logo Design, Graphic Design, Video Editing, Reels/Motion Graphics, UI/UX, and AI Automation. Reply in the customer's language when practical. Keep replies to 2-5 short sentences. Ask no more than 1-2 useful questions at once. For project enquiries, learn the requirement, approximate budget, and timeline. Never invent prices, discounts, contact details, portfolio links, guarantees, delivery times, payments, approvals, or completed work. If asked for price, explain it depends on scope and ask for the requirement and approximate budget. If asked for a human, say a Neloy Digital Solutions team member can continue the conversation. Do not mention Cloudflare or internal systems.`
        },
        {
          role: "user",
          content: userText.slice(0, 1500)
        }
      ]
    });

    console.log("AI_RESULT_TYPE", typeof result);

    const text =
      result?.response ??
      result?.result?.response ??
      result?.output_text ??
      result?.choices?.[0]?.message?.content ??
      result?.choices?.[0]?.text;

    if (typeof text === "string" && text.trim()) {
      console.log("AI_REPLY_OK");
      return text.trim().slice(0, 1800);
    }

    console.log("AI_EMPTY_RESPONSE", JSON.stringify(result).slice(0, 500));
    return fallback;
  } catch (error) {
    console.error("AI_RUN_ERROR", error?.stack || String(error));
    return fallback;
  }
}

async function sendMessengerReply(recipientId, replyText, pageAccessToken) {
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

  console.log("Messenger status:", response.status);
  console.log("Messenger reply:", await response.text());
}
