// Shared Gemini API helper with model fallback and robust error handling

const MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash-latest",
  "gemini-1.5-flash-8b",
];

export interface GeminiResponse {
  text: string;
  model: string;
}

export async function callGemini(
  apiKey: string,
  prompt: string,
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<GeminiResponse> {
  const { temperature = 0.4, maxTokens = 1024 } = opts;

  let lastError: Error = new Error("No models available");

  for (const model of MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature,
              maxOutputTokens: maxTokens,
              stopSequences: [],
            },
          }),
        }
      );

      const data = await res.json();

      // Check for API-level errors
      if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        // If this model isn't found, try the next one
        if (res.status === 404 || msg.includes("not found") || msg.includes("not supported")) {
          lastError = new Error(msg);
          continue;
        }
        throw new Error(msg);
      }

      // Check for blocked content
      const candidate = data.candidates?.[0];
      if (!candidate) {
        lastError = new Error("Empty response from Gemini");
        continue;
      }

      // Handle SAFETY / RECITATION blocks
      if (candidate.finishReason && candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS") {
        lastError = new Error(`Content blocked: ${candidate.finishReason}`);
        continue;
      }

      const text = candidate.content?.parts?.[0]?.text;
      if (!text) {
        lastError = new Error("No text in response");
        continue;
      }

      return { text: text.trim(), model };
    } catch (err: any) {
      // Network errors — don't try other models, just throw
      if (err.name === "TypeError" || err.message?.includes("fetch")) {
        throw new Error("Network error — check your internet connection.");
      }
      lastError = err;
      continue;
    }
  }

  throw lastError;
}
