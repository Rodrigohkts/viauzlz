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
    const jsonBody = await req.json();
    const { type, model, contents, instances, parameters, generationConfig } = jsonBody;
    const apiKey = "AIzaSyD7uWPNKHaonXmizLWhGbIUUxAKq-4lVIc"; // Hardcoded specific key with 6k credits
    const projectId = Deno.env.get("VERTEX_PROJECT_ID") || "midyear-spot-454018-j6";
    const isPreview = model.includes("3") || model.includes("preview");
    
    // Global endpoint is often required for early preview models
    const endpoint = isPreview ? "aiplatform.googleapis.com" : "us-central1-aiplatform.googleapis.com";
    const region = "us-central1"; 

    if (!apiKey) {
      throw new Error("VERTEX_API_KEY not configured in Supabase secrets");
    }

    let url = "";
    let body = {};

    if (type === "imagen") {
      url = `https://${endpoint}/v1beta/projects/${projectId}/locations/${region}/publishers/google/models/${model}:predict?key=${apiKey}`;
      body = {
        instances: instances || [{ prompt: contents?.[0]?.parts?.[0]?.text || "" }],
        parameters: parameters || { sampleCount: 1, aspectRatio: "1:1" }
      };
    } else {
      url = `https://${endpoint}/v1beta/projects/${projectId}/locations/${region}/publishers/google/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      body = {
        contents: contents || [],
        generationConfig: generationConfig || {},
      };
      
      if (!req.url.includes("stream=true")) {
        url = url.replace("streamGenerateContent?alt=sse&", "generateContent?");
      }
    }

    console.log(`Proxying request to: ${url.replace(apiKey, "REDACTED")}`);

    let response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    // ─── Automatic Fallback for 404 (Model Not Found) ─────────────────────
    if (response.status === 404 && isPreview) {
      console.warn(`Model ${model} not found (404). Attempting fallback...`);
      const fallbackModel = model.includes("pro") ? "gemini-2.0-pro-exp-02-05" : "gemini-2.5-flash-image";
      const fallbackRegion = "us-central1";
      const fallbackUrl = `https://us-central1-aiplatform.googleapis.com/v1beta/projects/${projectId}/locations/${fallbackRegion}/publishers/google/models/${fallbackModel}:${type === "imagen" ? "predict" : "generateContent"}?key=${apiKey}`;
      
      console.log(`Fallback URL: ${fallbackUrl.replace(apiKey, "REDACTED")}`);
      response = await fetch(fallbackUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    console.log(`Response status: ${response.status}`);
    
    // Robust parsing
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (!response.ok) {
        return new Response(JSON.stringify({ error: data.error?.message || "Vertex AI API Error", details: data }), {
          status: response.status,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(data), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    } else {
      const text = await response.text();
      return new Response(text, {
        status: response.status,
        headers: { ...CORS_HEADERS, "Content-Type": contentType },
      });
    }

  } catch (err: any) {
    console.error("Proxy Error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
