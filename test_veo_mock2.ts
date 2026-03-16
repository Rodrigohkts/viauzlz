import { GoogleGenAI } from "@google/genai";

async function run() {
  const ai = new GoogleGenAI({
    apiKey: "AIzaSyFakeKeyFakeKeyFakeKeyFakeKeyFake",
  });

  // Mock generateVideos
  const operation = {
    name: "models/veo-3.1-fast-generate-preview/operations/12345",
    done: false,
    _fromAPIResponse: (res: any) => res.apiResponse,
  } as any;

  console.log("Operation name:", operation.name);

  try {
    const op2 = await ai.operations.getVideosOperation({
      operation: operation,
    });
    console.log("SDK success:", op2);
  } catch (e: any) {
    console.log("SDK error:", e.message);
  }
}
run();
