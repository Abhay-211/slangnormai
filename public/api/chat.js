export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VITE_NVIDIA_API_KEY}`,
      },
      body: JSON.stringify(req.body),
    });

    // Read raw text first before parsing
    const rawText = await response.text();
    console.log("NVIDIA raw response:", rawText);
    console.log("NVIDIA status:", response.status);

    // If empty response
    if (!rawText || rawText.trim() === "") {
      return res.status(500).json({ error: "Empty response from NVIDIA API" });
    }

    // Try to parse JSON
    try {
      const data = JSON.parse(rawText);
      return res.status(response.status).json(data);
    } catch (parseErr) {
      return res.status(500).json({ error: "Invalid JSON from NVIDIA", raw: rawText });
    }

  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message });
  }
}