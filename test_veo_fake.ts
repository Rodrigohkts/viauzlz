import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({
    apiKey: "AIzaSyFakeKeyFakeKeyFakeKeyFakeKeyFake",
  });
  try {
    let operation = await ai.models.generateVideos({
      model: "veo-3.1-fast-generate-preview",
      prompt: "A neon hologram of a cat driving at top speed",
      config: {
        numberOfVideos: 1,
        resolution: "720p",
        aspectRatio: "16:9",
      },
    });
    console.log("Operation:", operation);
  } catch (e: any) {
    console.log("Error:", e.message);
  }
}
run();
