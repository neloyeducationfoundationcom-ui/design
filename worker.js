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

              if (event.sender?.id && event.message) {
                await sendMessengerReply(event.sender.id, env.PAGE_ACCESS_TOKEN);
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

async function sendMessengerReply(recipientId, pageAccessToken) {
  const token = (pageAccessToken || "").trim();

  console.log("Page token loaded:", token.length > 0, "length:", token.length);

  const reply = `Hi 👋 Thanks for contacting Neloy Digital Solutions.\n\nWhat service are you looking for?\n\nWebsite Design • Logo/Graphic Design • Video Editing • UI/UX • AI Automation\n\nPlease send your project requirement and approximate budget, and we'll guide you with the next step.`;

  const response = await fetch("https://graph.facebook.com/v26.0/me/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text: reply }
    })
  });

  console.log("Messenger status:", response.status);
  console.log("Messenger reply:", await response.text());
}
