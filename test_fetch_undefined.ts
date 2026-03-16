async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/undefined?key=AIzaSyFakeKeyFakeKeyFakeKeyFakeKeyFake`;
  const res = await fetch(url);
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Text:", text);
}
run();
