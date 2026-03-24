// netlify/functions/generate.mjs
// Calls OpenRouter free API with a compact prompt for fast response

export default async (req) => {
  const h = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") return new Response("", { status: 200, headers: h });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: h });

  const API_KEY = Netlify.env.get("OPENROUTER_API_KEY");
  if (!API_KEY) return new Response(JSON.stringify({ error: "OPENROUTER_API_KEY not set in Netlify env vars." }), { status: 500, headers: h });

  try {
    const { brand, product, category, price, listPrice, color, context } = await req.json();

    // Short, focused prompt for fast AI response
    const prompt = `Generate Amazon product JSON for: ${brand} ${product} (${category}, $${price}, ${color}). ${context || ""}

Return ONLY this JSON, no other text:
{"title":"full Amazon title with brand and keywords","breadcrumbs":["${category}","SubCat","SubSubCat","Type"],"rating":4.4,"ratingCount":${Math.floor(800 + Math.random() * 3000)},"boughtRecently":"${Math.floor(1 + Math.random() * 8)}K+","bulletPoints":["point1","point2","point3","point4","point5"],"productDescription":"3 sentence paragraph","highlights":{"Material":"val","Care":"val","Colour":"${color}","Pattern":"val","Season":"val","Fit":"val"},"styleAttributes":{"Colour":"${color}","Style":"val","Season":"val","Pattern":"val","Fit":"val","Occasion":"val"},"itemDetails":{"Date First Available":"15 Aug 2024","Manufacturer":"${brand}","ASIN":"B0${Math.random().toString(36).substring(2, 10).toUpperCase()}","Model":"${Math.random().toString(36).substring(2, 8).toUpperCase()}","Department":"val"},"sizes":${category === "Clothing" || category === "Sports & Outdoors" ? '["S","M","L","XL","XXL"]' : "null"},"reviews":[{"name":"Name1","stars":5,"title":"title","body":"2 sentences","date":"15 Mar 2026","verified":true},{"name":"Name2","stars":4,"title":"title","body":"2 sentences","date":"8 Mar 2026","verified":true},{"name":"Name3","stars":5,"title":"title","body":"2 sentences","date":"1 Mar 2026","verified":true},{"name":"Name4","stars":5,"title":"title","body":"2 sentences","date":"20 Feb 2026","verified":false}],"ratingBars":[70,16,8,3,3],"brandPositiveRating":"93%","brandRecentOrders":"1K+"}

Fill in realistic values. Keep responses SHORT. bulletPoints should be 1 sentence each. productDescription should be exactly 3 sentences. Review bodies should be exactly 2 sentences. Return ONLY the JSON.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://amazonmockuppage.netlify.app",
        "X-Title": "Amazon Mockup Generator",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: "Output ONLY valid JSON. No markdown. No backticks. No explanation. No thinking. Just raw JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.6,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(JSON.stringify({ error: `API error: ${response.status}`, details: errText }), { status: 502, headers: h });
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Aggressive cleaning
    content = content
      .replace(/<think>[\s\S]*?<\/think>/g, "")
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/^[^{]*/, "")  // Remove everything before first {
      .trim();

    // Extract JSON
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start === -1 || end === -1) {
      return new Response(JSON.stringify({ error: "No JSON found in AI response. Try again." }), { status: 500, headers: h });
    }

    let jsonStr = content.substring(start, end + 1);

    // Try to fix truncated JSON by closing open structures
    try {
      JSON.parse(jsonStr);
    } catch (e) {
      // Count unclosed brackets and braces
      let openBraces = 0, openBrackets = 0, inString = false, escaped = false;
      for (let i = 0; i < jsonStr.length; i++) {
        const c = jsonStr[i];
        if (escaped) { escaped = false; continue; }
        if (c === "\\") { escaped = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (c === "{") openBraces++;
        if (c === "}") openBraces--;
        if (c === "[") openBrackets++;
        if (c === "]") openBrackets--;
      }
      // Close any unclosed strings, arrays, objects
      if (inString) jsonStr += '"';
      for (let i = 0; i < openBrackets; i++) jsonStr += "]";
      for (let i = 0; i < openBraces; i++) jsonStr += "}";
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (e2) {
      return new Response(JSON.stringify({ error: "JSON parse failed. Please try again.", raw: jsonStr.substring(0, 200) }), { status: 500, headers: h });
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: h });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: h });
  }
};

export const config = { path: "/.netlify/functions/generate" };
