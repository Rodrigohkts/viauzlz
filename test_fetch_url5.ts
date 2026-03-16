async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview/operations/12345?key=AIzaSyFakeKeyFakeKeyFakeKeyFakeKeyFake`;
  const res = await fetch(url);
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Text:", text);
}
run();
