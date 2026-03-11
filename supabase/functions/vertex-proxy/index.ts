// Supabase Edge Function: vertex-proxy
// Proxies requests to Google Vertex AI using OAuth 2.0 (Service Account)
// Deploy: supabase functions deploy vertex-proxy
// Secret: supabase secrets set GOOGLE_SERVICE_ACCOUNT='<json content>'

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Google Service Account → OAuth 2.0 access token ─────────────────────
async function getAccessToken(serviceAccount: any): Promise<string> {
  const encoder = new TextEncoder();

  // Parse PEM private key
  const pemKey = serviceAccount.private_key as string;
  const pemBody = pemKey
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\n/g, "");

  const rawKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    rawKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  // Build JWT
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const b64url = (obj: object) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const signingInput = `${b64url(header)}.${b64url(payload)}`;

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signingInput)
  );

  const b64sig = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signingInput}.${b64sig}`;

  // Exchange JWT for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`OAuth token error: ${err}`);
  }

  const { access_token } = await tokenRes.json();
  return access_token;
}

// ─── Main handler ─────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // Load service account from secret
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT");
    if (!serviceAccountJson) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT secret not configured.");
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    const projectId = serviceAccount.project_id || "midyear-spot-454018-j6";
    const location = "us-central1";

    // Parse request
    const body = await req.json();
    const { type, model, contents, generationConfig, instances, parameters } = body;

    // Get OAuth token
    const accessToken = await getAccessToken(serviceAccount);

    let vertexUrl: string;
    let vertexBody: object;

    if (type === "imagen") {
      // Imagen 3 — text-to-image
      vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model || "imagen-3.0-generate-002"}:predict`;
      vertexBody = {
        instances: instances || [{ prompt: "" }],
        parameters: parameters || { sampleCount: 1, aspectRatio: "1:1" },
      };
    } else {
      // Gemini generateContent — multi-modal image editing / text
      vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model || "gemini-2.0-flash-preview-image-generation"}:generateContent`;
      vertexBody = {
        contents: contents || [],
        generationConfig: generationConfig || {},
      };
    }

    // Call Vertex AI
    const vertexRes = await fetch(vertexUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(vertexBody),
    });

    const vertexData = await vertexRes.json();

    if (!vertexRes.ok) {
      const msg = vertexData?.error?.message || `Vertex AI error: ${vertexRes.status}`;
      return new Response(JSON.stringify({ error: msg }), {
        status: vertexRes.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(vertexData), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("vertex-proxy error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
