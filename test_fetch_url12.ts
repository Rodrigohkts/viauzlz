async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/projects/12345/locations/global/operations/67890`;
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
