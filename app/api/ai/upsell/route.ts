import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { estimateGeminiCostInr } from "@/lib/engine";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const UPSELL_CATALOG = [
  { name: "Waffle Cone Classic", price: 6.5 },
  { name: "Double Choc Chunk", price: 4.0 },
  { name: "Mint Pistachio Cup", price: 7.0 },
  { name: "Salted Honey Stack", price: 5.5 },
  { name: "Raspberry Ripple Tub", price: 9.0 },
  { name: "Brown Butter Chip", price: 4.0 },
] as const;

function extractJsonObject(text: string): Record<string, unknown> {
  const cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error("No JSON object in model response");
  }
}

function buildFallback(cartItems: string[], maxDiscountPct: number) {
  const available = UPSELL_CATALOG.filter((i) => !cartItems.includes(i.name));
  const pick =
    available[Math.floor(Math.random() * Math.max(available.length, 1))] ||
    UPSELL_CATALOG[0];
  // Vary 5–18% (capped by policy), not a fixed 10%
  const ceiling = Math.min(18, Math.max(5, maxDiscountPct || 20));
  const pct = 5 + Math.floor(Math.random() * (ceiling - 4));
  const discounted = Math.round(pick.price * (1 - pct / 100) * 100) / 100;
  return {
    upsellItemName: pick.name,
    proposedDiscountPct: pct,
    originalPrice: pick.price,
    discountedPrice: discounted,
    aiReasoning:
      "AI service temporarily unavailable. Falling back to a small complementary discount on a cart-safe item.",
    cfoCast: `Fallback: $${(pick.price - discounted).toFixed(2)} off (${pct}%). Conservative basket-builder with low budget impact.`,
    riskScore: 15,
    confidence: 35,
    aiCostInr: 0,
  };
}

export async function POST(req: NextRequest) {
  let cartItems: string[] = [];
  let maxDiscountPct = 20;

  try {
    const body = await req.json();
    const { cartTotal, margin, policy } = body;
    cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];
    maxDiscountPct = Number(policy?.maxDiscountPct) || 20;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY missing",
        decision: buildFallback(cartItems, maxDiscountPct),
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.9,
      },
    });

    const prompt = `You are Profit Pilot, an AI sales agent for a dessert shop called "Sundae & Co."

A customer is checking out. Decide whether to offer an upsell discount on an additional item, and if so, how much.

CART CONTEXT:
- Items in cart: ${cartItems.join(", ") || "(empty)"}
- Cart Value: $${Number(cartTotal).toFixed(2)} (≈ ₹${Math.round(Number(cartTotal) * 83)})
- Blended Margin: ${margin}%

MERCHANT POLICIES:
- Max discount allowed: ${maxDiscountPct}%
- Minimum margin floor: ${policy?.minMarginFloor ?? 40}%
- Daily budget cap: ₹${policy?.dailyTotalCap ?? 5000}

AVAILABLE UPSELL ITEMS (pick ONE to recommend):
${UPSELL_CATALOG.map((i) => `- ${i.name} ($${i.price.toFixed(2)})`).join("\n")}

IMPORTANT:
- Do NOT recommend items already in the cart.
- Vary discounts — do NOT default to 10%. Prefer a mix across 5–${Math.min(25, maxDiscountPct)}% based on cart fit and margin.
- Pick the item that best complements THIS cart.

Respond with ONLY a valid JSON object (no markdown, no extra text):
{
  "upsellItemName": "<exact name from the list above>",
  "proposedDiscountPct": <number between 5 and ${Math.min(25, maxDiscountPct)}>,
  "originalPrice": <the item's original price as a number>,
  "discountedPrice": <the price after discount as a number>,
  "aiReasoning": "<2-3 sentence reasoning referencing cart composition, margin, and why this upsell makes sense>",
  "cfoCast": "<1-2 sentence CFO-style cost-benefit analysis with rupee numbers>",
  "riskScore": <number between 5 and 95>,
  "confidence": <number between 20 and 98>
}

Be honest about confidence — do not always return high confidence.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const usage = result.response.usageMetadata;
    const aiCostInr = estimateGeminiCostInr(
      usage?.promptTokenCount || 900,
      usage?.candidatesTokenCount || 280
    );

    const parsed = extractJsonObject(text);

    const name = String(parsed.upsellItemName || "");
    const catalog = UPSELL_CATALOG.find((i) => i.name === name) || UPSELL_CATALOG[0];
    let pct = Number(parsed.proposedDiscountPct);
    if (!Number.isFinite(pct)) pct = 10;
    pct = Math.min(maxDiscountPct, Math.max(5, Math.round(pct)));
    const originalPrice = catalog.price;
    const discountedPrice =
      Number(parsed.discountedPrice) > 0
        ? Math.round(Number(parsed.discountedPrice) * 100) / 100
        : Math.round(originalPrice * (1 - pct / 100) * 100) / 100;

    return NextResponse.json({
      success: true,
      decision: {
        upsellItemName: catalog.name,
        proposedDiscountPct: pct,
        originalPrice,
        discountedPrice,
        aiReasoning: String(parsed.aiReasoning || "Complementary upsell for this cart."),
        cfoCast: String(parsed.cfoCast || ""),
        riskScore: Math.min(95, Math.max(5, Number(parsed.riskScore) || 40)),
        confidence: Math.min(98, Math.max(20, Number(parsed.confidence) || 70)),
        aiCostInr,
      },
      usage: {
        promptTokens: usage?.promptTokenCount || null,
        completionTokens: usage?.candidatesTokenCount || null,
        aiCostInr,
      },
    });
  } catch (error: any) {
    console.error("Gemini upsell error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "AI reasoning failed",
      decision: buildFallback(cartItems, maxDiscountPct),
    });
  }
}
