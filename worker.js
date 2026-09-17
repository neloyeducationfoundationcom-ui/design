export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Meta webhook verification
    if (request.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      if (mode === "subscribe" && token === env.VERIFY_TOKEN && challenge) {
        return new Response(challenge, { status: 200 });
      }

      return new Response("Neloy Social Auto Reply webhook is running", { status: 200 });
    }

    // Facebook Messenger webhook
    if (request.method === "POST") {
      try {
        const body = await request.json();
        console.log("Webhook received");

        if (body.object === "page") {
          for (const entry of body.entry || []) {
            for (const event of entry.messaging || []) {
              // Ignore messages sent by the Page itself
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
        console.error("Webhook error:", error);
        return new Response("EVENT_RECEIVED", { status: 200 });
      }
    }

    return new Response("Method Not Allowed", { status: 405 });
  }
};

async function generateAIReply(userText, env) {
  const fallback = `Hi 👋 Thanks for contacting Neloy Digital Solutions.\n\nWe can help with Website Design, Logo/Graphic Design, Video Editing, UI/UX, and AI Automation.\n\nPlease send your project requirement and approximate budget, and our team will guide you with the next step.`;

  try {
    if (!env.AI) {
      console.log("Workers AI binding not available; using fallback reply");
      return fallback;
    }

    const result = await env.AI.run("@cf/google/gemma-4-26b-a4b-it", {
      messages: [
        {
          role: "system",
          content: `You are the AI customer assistant for Neloy Digital Solutions.\n\nYour job is to help potential clients understand services and qualify their project naturally.\n\nServices: Website Design, Logo Design, Graphic Design, Video Editing, Reels/Motion Graphics, UI/UX, and AI Automation.\n\nRules:\n- Be friendly, professional, concise, and human-sounding.\n- Reply in the same language as the customer when practical.\n- Keep replies to roughly 2-5 short sentences.\n- Ask at most 1-2 useful follow-up questions at a time.\n- For project inquiries, try to learn the requirement, approximate budget, and timeline.\n- Do not invent prices, discounts, phone numbers, emails, portfolio links, guarantees, or delivery times.\n- If the customer asks for a price, explain that pricing depends on scope and ask for the project requirement and budget.\n- If the customer asks for a human, say a Neloy Digital Solutions team member can continue the conversation.\n- Do not mention that you are powered by Cloudflare or describe internal systems.\n- Never claim work has been completed, approved, paid, or scheduled unless the customer explicitly said so.`
        },
        {
          role: "user",
          content: userText.slice(0, 1500)
        }
      ],
      chat_template_kwargs: {
        enable_thinking: false
      }
    });

    const text = result?.response || result?.result?.response || result?.output_text;

    if (typeof text === "string" && text.trim()) {
      return text.trim().slice(0, 1800);
    }

    console.log("Workers AI returned no usable text; using fallback reply");
    return fallback;
  } catch (error) {
    console.error("Workers AI error:", error);
    return fallback;
  }
}

async function sendMessengerReply(recipientId, replyText, pageAccessToken) {
  const token = (pageAccessToken || "").trim();

  console.log("Page token loaded:", token.length > 0, "length:", token.length);

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
