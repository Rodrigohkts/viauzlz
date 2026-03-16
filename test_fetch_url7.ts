async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/operations/12345?key=invalid_key_123`;
  const res = await fetch(url);
  console.log("Status:", res.status, res.statusText);
  const text = await res.text();
  console.log("Text:", text);
}
run();
