// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // read request body
  let body = "";
  for await (const chunk of req) body += chunk;
  const payload = JSON.parse(body);

  // Google Gemini API format'ına dönüştür
  const geminiPayload = {
    contents: [
      {
        parts: [
          {
            text: payload.prompt || payload.messages[0]?.content || "",
          },
        ],
      },
    ],
    generationConfig: {
      temperature: payload.temperature || 0.7,
      maxOutputTokens: payload.max_tokens || 1024,
    },
  };

  // Google Gemini API'ye istek gönder
  const apiRes = await fetch(
    `${process.env.GEMINI_API_BASE_URL}/models/${process.env.GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify(geminiPayload),
    }
  );

  const data = await apiRes.json();

  // Gemini response'unu OpenAI format'ına dönüştür (uyumluluk için)
  const transformedResponse = {
    choices: [
      {
        message: {
          role: "assistant",
          content:
            data.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Üzgünüm, bir yanıt oluşturamadım.",
        },
      },
    ],
  };

  // Preserve status, headers and body
  res.status(apiRes.status);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(transformedResponse));
}
