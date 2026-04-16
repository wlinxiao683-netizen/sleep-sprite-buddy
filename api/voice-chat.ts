declare const process: { env: Record<string, string | undefined> };

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "15mb",
    },
  },
};

type HistoryItem = {
  role?: "user" | "model";
  text?: string;
};

function extractModelText(payload: any): string {
  const parts = payload?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return "";

  return parts
    .map((part: any) => (typeof part?.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

function extractTaggedValue(text: string, tag: "TRANSCRIPT" | "REPLY") {
  const regex = new RegExp(`${tag}:\\s*([\\s\\S]*?)(?=\\n[A-Z_]+:\\s|$)`, "i");
  return text.match(regex)?.[1]?.trim() || "";
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).send("Method not allowed.");
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).send("Missing GEMINI_API_KEY on the server.");
    return;
  }

  try {
    const { audioBase64, mimeType, history } = req.body ?? {};

    if (!audioBase64 || !mimeType) {
      res.status(400).send("Missing audioBase64 or mimeType.");
      return;
    }

    const safeHistory = Array.isArray(history)
      ? (history as HistoryItem[])
          .filter((item) => item && typeof item.text === "string" && item.text.trim())
          .slice(-6)
          .map((item) => `${item.role === "model" ? "Lulu" : "User"}: ${item.text?.trim()}`)
          .join("\n")
      : "";

    const prompt = [
      "You are Lulu, a warm, gentle, concise bedtime companion.",
      "The user sent one short audio clip.",
      "First, transcribe exactly what the user said.",
      "Then, reply naturally and briefly in a calm tone. Keep the reply under 80 words.",
      "Output exactly in this format and nothing else:",
      "TRANSCRIPT: <user speech>",
      "REPLY: <your reply>",
      safeHistory ? `Recent conversation:\n${safeHistory}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: audioBase64,
                  },
                },
              ],
            },
          ],
        }),
      },
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      res.status(geminiResponse.status).send(errorText || "Gemini request failed.");
      return;
    }

    const geminiJson = await geminiResponse.json();
    const modelText = extractModelText(geminiJson);

    const userText = extractTaggedValue(modelText, "TRANSCRIPT");
    const replyText = extractTaggedValue(modelText, "REPLY");

    if (!replyText) {
      res.status(502).send("Gemini returned an empty reply.");
      return;
    }

    res.status(200).json({
      userText,
      replyText,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Voice API failed.";
    res.status(500).send(message);
  }
}
