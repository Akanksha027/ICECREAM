import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { estimateGeminiCostInr } from "@/lib/engine";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/** Hard cap so checkout never stalls waiting on Gemini. */
const AI_TIMEOUT_MS = 2500;

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
  const ceiling = Math.min(18, Math.max(5, maxDiscountPct || 20));
  const pct = 5 + Math.floor(Math.random() * (ceiling - 4));
  const discounted = Math.round(pick.price * (1 - pct / 100) * 100) / 100;
  return {
    upsellItemName: pick.name,
    proposedDiscountPct: pct,
    originalPrice: pick.price,
    discountedPrice: discounted,
    aiReasoning: "Quick complementary pick for this cart.",
    cfoCast: `₹${Math.round((pick.price - discounted) * 83)} off · low budget impact.`,
    riskScore: 20,
    confidence: 62,
    aiCostInr: 0,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`AI timeout after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

export async function POST(req: NextRequest) {
  let cartItems: string[] = [];
  let maxDiscountPct = 20;

  try {
    const body = await req.json();
    const { cartTotal, margin, policy } = body;
    cartItems = Array.isArray(body.cartItems) ? body.cartItems : [];
    maxDiscountPct = Number(policy?.maxDiscountPct) || 20;
    const maxPct = Math.min(25, maxDiscountPct);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY missing",
        decision: buildFallback(cartItems, maxDiscountPct),
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
        maxOutputTokens: 180,
      },
    });

    // Short prompt = faster TTFT / completion
    const prompt = `Dessert shop upsell agent. Cart: [${cartItems.join(", ") || "empty"}] $${Number(cartTotal).toFixed(2)}, margin ${margin}%. Max discount ${maxPct}%.
Pick ONE item NOT in cart from: ${UPSELL_CATALOG.map((i) => `${i.name} $${i.price}`).join("; ")}.
Vary % (5-${maxPct}), do not always use 10.
JSON only:
{"upsellItemName":"exact name","proposedDiscountPct":n,"originalPrice":n,"discountedPrice":n,"aiReasoning":"one short sentence","cfoCast":"one short sentence","riskScore":n,"confidence":n}`;

    const result = await withTimeout(model.generateContent(prompt), AI_TIMEOUT_MS);
    const text = result.response.text();
    const usage = result.response.usageMetadata;
    const aiCostInr = estimateGeminiCostInr(
      usage?.promptTokenCount || 400,
      usage?.candidatesTokenCount || 120
    );

    const parsed = extractJsonObject(text);
    const name = String(parsed.upsellItemName || "");
    const catalog =
      UPSELL_CATALOG.find((i) => i.name === name) ||
      UPSELL_CATALOG.find((i) => !cartItems.includes(i.name)) ||
      UPSELL_CATALOG[0];

    let pct = Number(parsed.proposedDiscountPct);
    if (!Number.isFinite(pct)) pct = 8 + Math.floor(Math.random() * 8);
    pct = Math.min(maxDiscountPct, Math.max(5, Math.round(pct)));
    const originalPrice = catalog.price;
    const discountedPrice =
      Number(parsed.discountedPrice) > 0
        ? Math.round(Number(parsed.discountedPrice) * 100) / 100
        : Math.round(originalPrice * (1 - pct / 100) * 100) / 100;

    let confidence = Number(parsed.confidence);
    if (!Number.isFinite(confidence)) confidence = 70;
    if (confidence > 0 && confidence <= 1) confidence = Math.round(confidence * 100);
    confidence = Math.min(98, Math.max(20, Math.round(confidence)));

    return NextResponse.json({
      success: true,
      decision: {
        upsellItemName: catalog.name,
        proposedDiscountPct: pct,
        originalPrice,
        discountedPrice,
        aiReasoning: String(parsed.aiReasoning || "Pairs well with your cart.").slice(0, 160),
        cfoCast: String(parsed.cfoCast || "").slice(0, 120),
        riskScore: Math.min(95, Math.max(5, Number(parsed.riskScore) || 40)),
        confidence,
        aiCostInr,
      },
      usage: {
        promptTokens: usage?.promptTokenCount || null,
        completionTokens: usage?.candidatesTokenCount || null,
        aiCostInr,
      },
    });
  } catch (error: any) {
    console.error("Gemini upsell error:", error?.message || error);
    // Fast path: never leave the customer waiting — return a cart-safe offer immediately
    return NextResponse.json({
      success: false,
      timedOut: String(error?.message || "").includes("timeout"),
      error: error.message || "AI reasoning failed",
      decision: buildFallback(cartItems, maxDiscountPct),
    });
  }
}
