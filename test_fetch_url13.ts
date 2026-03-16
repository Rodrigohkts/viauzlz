async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview/projects/123/locations/global/operations/456`;
  const res = await fetch(url, {
    headers: {
      "x-goog-api-key": "AIzaSyFakeKeyFakeKeyFakeKeyFakeKeyFake",
    },
  });
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Text:", text);
}
run();
