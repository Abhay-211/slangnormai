export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { systemPrompt, userPrompt, maxTokens } = req.body;

  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens: maxTokens || 800,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.json();
      return res.status(groqRes.status).json({ error: err?.error?.message || "Groq API error" });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ content });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}