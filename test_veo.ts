import { GoogleGenAI } from "@google/genai";

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  let operation = await ai.models.generateVideos({
    model: "veo-3.1-fast-generate-preview",
    prompt: "A neon hologram of a cat driving at top speed",
    config: {
      numberOfVideos: 1,
      resolution: "720p",
      aspectRatio: "16:9",
    },
  });

  console.log("Operation name:", operation.name);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/${operation.name}?key=${apiKey}`;
    console.log("Fetching:", url.replace(apiKey || "", "HIDDEN"));
    const res = await fetch(url);
    console.log("Status:", res.status, res.statusText);
    const data = await res.json();
    console.log("Data:", data);
  } catch (e: any) {
    console.log("Fetch error:", e.message);
  }
}
run();
