import { Router } from "express";
import { pool } from "./db.js";
import { requireAuth } from "./auth.js";

const router = Router();

async function getSetting(key) {
  const [rows] = await pool.query("SELECT value FROM system_settings WHERE `key` = ?", [key]);
  return rows[0]?.value || "";
}

/**
 * No-key fallback: parse pasted text lines like
 *   "Oil filter 10 x 450"  |  "Brake pads, 4, 1200"  |  "2 Air filter @ 950"
 * into { name, quantity, unit_price }.
 */
function parseTextItems(text) {
  const items = [];
  for (const raw of String(text).split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.length < 3) continue;
    const nums = [...line.matchAll(/(\d+(?:\.\d+)?)/g)].map((m) => ({ v: parseFloat(m[1]), i: m.index }));
    let name = line, quantity = 1, unit_price = null;
    if (nums.length >= 2) {
      const last = nums[nums.length - 1];
      const prev = nums[nums.length - 2];
      unit_price = last.v;
      quantity = prev.v > 0 && prev.v < 100000 ? prev.v : 1;
      name = line.slice(0, prev.i).replace(/[\s,;:|xX@*-]+$/, "").trim();
      if (name.length < 3) {
        // Leading quantity, e.g. "2 Air filter @ 950" — name sits between the numbers
        const numStr = line.slice(prev.i).match(/^\d+(?:\.\d+)?/)?.[0] ?? "";
        name = line.slice(prev.i + numStr.length, last.i).replace(/^[\s,;:|xX@*.-]+|[\s,;:|xX@*-]+$/g, "").trim();
      }
    } else if (nums.length === 1) {
      const n = nums[0];
      const before = line.slice(0, n.i).trim();
      const after = line.slice(n.i + String(n.v).length).trim();
      if (before.length >= 3) { name = before.replace(/[\s,;:|xX@*-]+$/, ""); quantity = n.v; }
      else if (after.length >= 3) { name = after.replace(/^[\s,;:|xX@*.-]+/, ""); quantity = n.v; }
      else continue;
    }
    name = name.replace(/^\d+[.)-]\s*/, "").trim();
    if (name.length >= 3) items.push({ name, quantity, unit_price });
  }
  return items;
}

const SYSTEM_PROMPT =
  "You read photos of automobile spare parts lists, purchase orders or handwritten requirements. Extract every line item.";

async function extractWithGemini(key, image) {
  const base64 = image.replace(/^data:image\/\w+;base64,/, "");
  const mime = image.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: 'Extract all spare part items with quantity and unit price if shown. Reply with JSON only: {"items":[{"name":"...","quantity":1,"unit_price":null}]}' },
              { inlineData: { mimeType: mime, data: base64 } },
            ],
          },
        ],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error?.message || `Gemini request failed (${res.status})`);
  }
  const j = await res.json();
  const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  const parsed = JSON.parse(text.replace(/```json|```/g, "").trim() || "{}");
  return parsed.items || [];
}

async function extractWithOpenAI(key, image) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract all spare part items with quantity and unit price if shown." },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "items",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    quantity: { type: "number" },
                    unit_price: { type: ["number", "null"] },
                  },
                  required: ["name", "quantity", "unit_price"],
                  additionalProperties: false,
                },
              },
            },
            required: ["items"],
            additionalProperties: false,
          },
        },
      },
    }),
  });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j.error?.message || `OpenAI request failed (${res.status})`);
  }
  const j = await res.json();
  return JSON.parse(j.choices?.[0]?.message?.content || "{}").items || [];
}

// POST /api/ai/extract  { image?: dataURL, text?: string }
router.post("/ai/extract", requireAuth, async (req, res, next) => {
  try {
    const { image, text } = req.body || {};
    const [provider, key] = await Promise.all([getSetting("ai_provider"), getSetting("ai_api_key")]);

    if (text && !image) {
      // Pasted text: use AI if a key is set, otherwise the built-in parser.
      if (key) {
        try {
          const items = await extractTextWithAI(provider || "gemini", key, text);
          return res.json({ items, mode: "ai" });
        } catch {
          /* fall through to parser */
        }
      }
      return res.json({ items: parseTextItems(text), mode: "parser" });
    }

    if (!image || !String(image).startsWith("data:image/")) {
      return res.status(400).json({ error: "Upload an image or paste the quotation text" });
    }
    if (!key) {
      return res.status(400).json({
        error:
          "Reading images needs an AI key. Ask the Super Admin to add one in Settings → AI Quotation (a free Google Gemini key works), or use the Paste text option instead.",
      });
    }
    const items =
      (provider || "gemini") === "openai" ? await extractWithOpenAI(key, image) : await extractWithGemini(key, image);
    res.json({
      items: items.map((i) => ({
        name: String(i.name),
        quantity: Number(i.quantity) || 1,
        unit_price: i.unit_price == null ? null : Number(i.unit_price),
      })),
      mode: "ai",
    });
  } catch (e) {
    next(e);
  }
});

async function extractTextWithAI(provider, key, text) {
  const prompt = `Extract spare part line items from this text. Reply with JSON only: {"items":[{"name":"...","quantity":1,"unit_price":null}]}\n\n${text}`;
  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error("OpenAI request failed");
    const j = await res.json();
    return JSON.parse(j.choices?.[0]?.message?.content || "{}").items || [];
  }
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) throw new Error("Gemini request failed");
  const j = await res.json();
  const t = j.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return JSON.parse(t.replace(/```json|```/g, "").trim() || "{}").items || [];
}

export default router;
