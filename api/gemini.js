// api/gemini.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    console.log("📥 İstek alındı");

    // read request body
    let body = "";
    for await (const chunk of req) body += chunk;

    console.log("📄 Body okundu, uzunluk:", body.length);

    const payload = JSON.parse(body);
    console.log("📋 Payload parsed:", {
      hasPrompt: !!payload.prompt,
      hasMessages: !!payload.messages,
      messageCount: payload.messages?.length || 0,
      promptLength: payload.prompt?.length || 0,
    });

    // Prompt'u daha iyi çıkar
    let promptText = "";
    if (payload.prompt) {
      promptText = payload.prompt;
    } else if (payload.messages && payload.messages.length > 0) {
      // Son mesajı al veya tüm mesajları birleştir
      const lastMessage = payload.messages[payload.messages.length - 1];
      promptText = lastMessage?.content || "";
    }

    if (!promptText) {
      console.log("❌ Prompt bulunamadı");
      return res.status(400).json({
        error: "Prompt veya mesaj bulunamadı",
        received: payload,
      });
    }

    console.log("✅ Prompt çıkarıldı, uzunluk:", promptText.length);

    // Google Gemini API format'ına dönüştür
    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: promptText,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: payload.temperature || 0.7,
        maxOutputTokens: payload.max_tokens || 2048, // Artırdım
        topK: 40,
        topP: 0.95,
      },
    };

    console.log("🚀 Gemini API'ye istek gönderiliyor...");

    // Timeout kontrolü ile fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.log("⏰ Timeout: İstek iptal edildi");
    }, 30000); // 30 saniye timeout

    // Google Gemini API'ye istek gönder
    const apiRes = await fetch(
      `${process.env.GEMINI_API_BASE_URL}/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(geminiPayload),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    console.log("📡 API yanıtı alındı, status:", apiRes.status);

    if (!apiRes.ok) {
      const errorText = await apiRes.text();
      console.log("❌ API Hatası:", errorText);
      return res.status(apiRes.status).json({
        error: "Gemini API hatası",
        status: apiRes.status,
        details: errorText,
      });
    }

    const data = await apiRes.json();
    console.log("📊 Yanıt parse edildi:", {
      hasCandidates: !!data.candidates,
      candidateCount: data.candidates?.length || 0,
      hasContent: !!data.candidates?.[0]?.content,
      hasText: !!data.candidates?.[0]?.content?.parts?.[0]?.text,
    });

    // Hata kontrolü - Gemini bazen candidates döndürmeyebilir
    if (!data.candidates || data.candidates.length === 0) {
      console.log("❌ Gemini'den candidates alınamadı:", data);
      return res.status(500).json({
        error: "Gemini'den yanıt alınamadı",
        geminiResponse: data,
        reason: "No candidates returned",
      });
    }

    const candidate = data.candidates[0];

    // Safety rating kontrolü
    if (candidate.finishReason === "SAFETY") {
      console.log("🛡️ Güvenlik filtresine takıldı");
      return res.status(400).json({
        error: "İçerik güvenlik filtresine takıldı",
        reason: "SAFETY",
        safetyRatings: candidate.safetyRatings,
      });
    }

    const responseText = candidate.content?.parts?.[0]?.text;

    if (!responseText) {
      console.log("❌ Yanıt metni bulunamadı:", candidate);
      return res.status(500).json({
        error: "Yanıt metni çıkarılamadı",
        candidate: candidate,
        reason: "No text in response",
      });
    }

    console.log("✅ Başarılı yanıt, uzunluk:", responseText.length);

    // Gemini response'unu OpenAI format'ına dönüştür (uyumluluk için)
    const transformedResponse = {
      choices: [
        {
          message: {
            role: "assistant",
            content: responseText,
          },
          finish_reason: candidate.finishReason || "stop",
        },
      ],
      usage: {
        prompt_tokens: promptText.length / 4, // Yaklaşık
        completion_tokens: responseText.length / 4, // Yaklaşık
      },
    };

    // Preserve status, headers and body
    res.status(200);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(transformedResponse));
  } catch (error) {
    console.error("💥 Hata oluştu:", error);

    if (error.name === "AbortError") {
      return res.status(408).json({
        error: "İstek zaman aşımına uğradı",
        type: "timeout",
        message:
          "AI yanıt vermek için çok uzun süre aldı. Lütfen tekrar deneyin.",
      });
    }

    return res.status(500).json({
      error: "Sunucu hatası",
      type: error.name,
      message: error.message,
      details: "Bir hata oluştu. Lütfen tekrar deneyin.",
    });
  }
}
