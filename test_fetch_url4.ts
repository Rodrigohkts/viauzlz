async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning?key=AIzaSyFakeKeyFakeKeyFakeKeyFakeKeyFake`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Text:", text);
}
run();
