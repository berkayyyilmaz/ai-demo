// api/openrouter.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  // read request body
  let body = "";
  for await (const chunk of req) body += chunk;
  const payload = JSON.parse(body);

  // forward to OpenRouter
  const apiRes = await fetch(process.env.VITE_OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // key stored safely in Vercel env var
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await apiRes.json();

  // Preserve status, headers and body
  res.status(apiRes.status);
  res.setHeader("Content-Type", apiRes.headers.get("content-type"));
  res.send(JSON.stringify(data));
}
