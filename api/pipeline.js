export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const systemPrompt = `You are simulating a Financial RAG + Hallucination Detection pipeline over Indian financial news (26,961 articles from Economic Times, Mint, Business Standard).

Given a user query, respond ONLY with a JSON object (no markdown, no extra text, no backticks) in this exact schema:
{
  "retrieved": [
    {"score": 0.00, "source": "Article headline snippet", "text": "Relevant excerpt from retrieved chunk (2-3 sentences)"},
    {"score": 0.00, "source": "Article headline snippet", "text": "Relevant excerpt"},
    {"score": 0.00, "source": "Article headline snippet", "text": "Relevant excerpt"}
  ],
  "answer": "The RAG-generated answer (2-4 sentences, grounded strictly in the retrieved context)",
  "validation": {
    "verdict": "MOSTLY_RELIABLE",
    "sentences": [
      {"text": "Sentence from the answer.", "label": "SUPPORTED", "reason": "Brief reason (1 sentence)"}
    ],
    "support_pct": 70,
    "halluc_pct": 30
  },
  "selfcheck": {
    "consistency": 0.80,
    "risk": "LOW",
    "pairwise": [0.82, 0.79, 0.78]
  },
  "agreement": true
}

Rules:
- verdict must be one of: MOSTLY_RELIABLE, PARTIALLY_RELIABLE, UNRELIABLE
- label must be one of: SUPPORTED, UNSUPPORTED, CONTRADICTED
- risk must be one of: LOW, MEDIUM, HIGH
- retrieved scores should be realistic (0.55-0.72 range)
- Occasionally include 1-2 UNSUPPORTED sentences to show the validator working
- selfcheck consistency: LOW risk = 0.75-0.95, MEDIUM = 0.45-0.74, HIGH = 0.20-0.44
- Return ONLY the JSON object, nothing else`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query }
        ],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const raw = data.choices[0].message.content;
    try {
      const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
      return res.status(200).json(parsed);
    } catch {
      return res.status(500).json({ error: "Failed to parse model response." });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message || "Pipeline error" });
  }
}
