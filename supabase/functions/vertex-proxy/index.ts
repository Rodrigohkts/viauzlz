import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { type, model, contents, instances, parameters, generationConfig } = await req.json();
    const apiKey = Deno.env.get("VERTEX_API_KEY");
    const projectId = Deno.env.get("VERTEX_PROJECT_ID") || "midyear-spot-454018-j6";
    const region = "us-central1";

    if (!apiKey) {
      throw new Error("VERTEX_API_KEY not configured in Supabase secrets");
    }

    let url = "";
    let body = {};

    if (type === "imagen") {
      // Imagen 3 Text-to-Image
      url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:predict?key=${apiKey}`;
      body = {
        instances: instances || [{ prompt: contents?.[0]?.parts?.[0]?.text || "" }],
        parameters: parameters || { sampleCount: 1, aspectRatio: "1:1" }
      };
    } else {
      // Gemini models (Flash/Pro) for Text or Image Editing
      url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      body = {
        contents: contents || [],
        generationConfig: generationConfig || {},
      };
      
      // If not streaming requested, use non-stream endpoint
      if (!req.url.includes("stream=true")) {
        url = url.replace("streamGenerateContent?alt=sse&", "generateContent?");
      }
    }

    console.log(`Proxying ${type} request to: ${url.split('?')[0]}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Vertex AI Error:", data);
      return new Response(JSON.stringify({ error: data.error?.message || "Vertex AI API Error", details: data }), {
        status: response.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Proxy Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
