// netlify/functions/generate.mjs
// Netlify serverless function — calls OpenRouter API (FREE, no credit card)
// Uses free models available on OpenRouter

export default async (req) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });
  }

  const API_KEY = Netlify.env.get("OPENROUTER_API_KEY");

  if (!API_KEY) {
    return new Response(
      JSON.stringify({
        error:
          "OPENROUTER_API_KEY not set. Add it in Netlify → Site Configuration → Environment Variables.",
      }),
      { status: 500, headers }
    );
  }

  try {
    const body = await req.json();
    const { brand, product, category, price, listPrice, color, context } = body;

    const prompt = `You are an Amazon product listing data generator. Generate realistic, detailed Amazon product page data for the following product. Return ONLY valid JSON — no markdown backticks, no preamble, no explanation. Just the raw JSON object.

Brand: ${brand}
Product: ${product}
Category: ${category}
Price: $${price}
List Price: $${listPrice}
Colour: ${color}
${context ? `Additional Context: ${context}` : ""}

Generate this EXACT JSON structure (all fields required):
{
  "title": "Full product title exactly as Amazon would show it (include brand, product name, key features, colour)",
  "breadcrumbs": ["Top Category", "Sub Category", "Sub Sub Category", "Product Type"],
  "rating": 4.4,
  "ratingCount": 2847,
  "boughtRecently": "2K+",
  "bulletPoints": [
    "Detailed bullet point 1 about key feature with specifics",
    "Detailed bullet point 2 about materials/technology",
    "Detailed bullet point 3 about design/comfort",
    "Detailed bullet point 4 about practical features",
    "Detailed bullet point 5 about what's included / care instructions"
  ],
  "productDescription": "A detailed 3-4 sentence product description paragraph as seen on Amazon, mentioning brand, key technologies, materials, use cases, and care.",
  "highlights": {
    "Material composition": "specific material",
    "Care instructions": "specific care",
    "Colour": "${color}",
    "Pattern": "pattern type",
    "Season": "season",
    "Fit Type": "fit description"
  },
  "styleAttributes": {
    "Colour": "${color}",
    "Style": "style name",
    "Sleeve Type": "if applicable or remove",
    "Season": "season",
    "Pattern": "pattern",
    "Fit Type": "fit",
    "Occasion": "occasion type"
  },
  "itemDetails": {
    "Date First Available": "a recent date in 2024-2025",
    "Manufacturer": "${brand}",
    "ASIN": "generate realistic ASIN starting with B0",
    "Item Model Number": "generate realistic model number",
    "Department": "appropriate department"
  },
  "sizes": ["S", "M", "L", "XL", "XXL"],
  "reviews": [
    {
      "name": "Realistic full name",
      "stars": 5,
      "title": "Short punchy review title",
      "body": "2-3 sentence realistic review mentioning the product specifically",
      "date": "15 March 2026",
      "verified": true
    },
    {
      "name": "Different name",
      "stars": 5,
      "title": "Different review title",
      "body": "2-3 sentence realistic positive review",
      "date": "10 March 2026",
      "verified": true
    },
    {
      "name": "Another name",
      "stars": 4,
      "title": "Slightly less enthusiastic title",
      "body": "2-3 sentence review with minor critique but overall positive",
      "date": "2 March 2026",
      "verified": true
    },
    {
      "name": "Fourth reviewer",
      "stars": 5,
      "title": "Enthusiastic title",
      "body": "2-3 sentence glowing review",
      "date": "22 February 2026",
      "verified": false
    }
  ],
  "ratingBars": [71, 15, 8, 3, 3],
  "brandPositiveRating": "93%",
  "brandRecentOrders": "1K+"
}

IMPORTANT RULES:
- For non-clothing categories (Electronics, Beauty, Books, Home), set "sizes" to null
- For Books, adapt highlights/style to show Author, Pages, Publisher, ISBN, Format instead of material/fit
- For Electronics, show Connectivity, Battery Life, Compatibility instead of fabric details
- Make bullet points specific and detailed — mention actual technologies, materials, features
- Reviews should feel authentic with varied writing styles
- The title should be long and keyword-rich like real Amazon titles
- All text must be professional and realistic
- Return ONLY the JSON object, nothing else`;

    // Try multiple free models in order of preference
    const freeModels = [
      "google/gemini-2.0-flash-exp:free",
      "meta-llama/llama-4-scout:free",
      "deepseek/deepseek-chat-v3-0324:free",
      "qwen/qwen3-235b-a22b:free",
    ];

    let lastError = null;

    for (const model of freeModels) {
      try {
        console.log(`Trying model: ${model}`);

        const response = await fetch(
          "https://openrouter.ai/api/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_KEY}`,
              "HTTP-Referer": "https://amazonmockuppage.netlify.app",
              "X-Title": "Amazon Mockup Generator",
            },
            body: JSON.stringify({
              model: model,
              messages: [
                {
                  role: "system",
                  content:
                    "You are a JSON data generator. Return ONLY valid JSON. No markdown, no backticks, no explanation, no preamble, no thinking tags. Just the JSON object.",
                },
                { role: "user", content: prompt },
              ],
              temperature: 0.7,
              max_tokens: 2500,
            }),
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          console.error(`Model ${model} failed:`, response.status, errText);
          lastError = `${model}: ${response.status}`;
          continue; // Try next model
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || "";

        // Clean the response — remove thinking tags, markdown, etc.
        let cleaned = content
          .replace(/<think>[\s\S]*?<\/think>/g, "")
          .replace(/```json\s*/g, "")
          .replace(/```\s*/g, "")
          .trim();

        // Find the JSON object in the response
        const jsonStart = cleaned.indexOf("{");
        const jsonEnd = cleaned.lastIndexOf("}");
        if (jsonStart !== -1 && jsonEnd !== -1) {
          cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
        }

        const parsed = JSON.parse(cleaned);
        console.log(`Success with model: ${model}`);
        return new Response(JSON.stringify(parsed), {
          status: 200,
          headers,
        });
      } catch (modelErr) {
        console.error(`Model ${model} error:`, modelErr.message);
        lastError = `${model}: ${modelErr.message}`;
        continue; // Try next model
      }
    }

    // All models failed
    return new Response(
      JSON.stringify({
        error: "All AI models failed. Please try again in a moment.",
        lastError,
      }),
      { status: 502, headers }
    );
  } catch (err) {
    console.error("Function error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers }
    );
  }
};

export const config = {
  path: "/.netlify/functions/generate",
};
