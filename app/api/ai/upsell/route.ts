import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const { cartItems, cartTotal, margin, policy } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are Profit Pilot, an AI sales agent for a dessert shop called "Sundae & Co."

A customer is checking out. Decide whether to offer an upsell discount on an additional item, and if so, how much.

CART CONTEXT:
- Items in cart: ${cartItems.join(", ")}
- Cart Value: $${cartTotal.toFixed(2)} (≈ ₹${Math.round(cartTotal * 83)})
- Blended Margin: ${margin}%

MERCHANT POLICIES:
- Max discount allowed: ${policy.maxDiscountPct}%
- Minimum margin floor: ${policy.minMarginFloor}%
- Daily budget cap: ₹${policy.dailyTotalCap}

AVAILABLE UPSELL ITEMS (pick ONE to recommend):
- Waffle Cone Classic ($6.50)
- Double Choc Chunk ($4.00)
- Mint Pistachio Cup ($7.00)
- Salted Honey Stack ($5.50)
- Raspberry Ripple Tub ($9.00)
- Brown Butter Chip ($4.00)

IMPORTANT: Do NOT recommend items already in the cart.

You MUST respond with ONLY a valid JSON object (no markdown fencing, no extra text) with these fields:
{
  "upsellItemName": "<exact name from the list above>",
  "proposedDiscountPct": <number between 5 and 25>,
  "originalPrice": <the item's original price as a number>,
  "discountedPrice": <the price after discount as a number>,
  "aiReasoning": "<2-3 sentence reasoning referencing cart composition, margin, and why this upsell makes sense>",
  "cfoCast": "<1-2 sentence CFO-style cost-benefit analysis with rupee numbers. Frame against customer LTV. E.g. '₹X discount costs Y% of estimated ₹Z LTV, historically lifts repeat-purchase odds ~W% for dessert customers.'>",
  "riskScore": <number between 5 and 95>
}

Think like a smart, cautious sales agent. Reference actual numbers. Frame reasoning against LTV.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Parse JSON, stripping any markdown fencing
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      success: true,
      decision: {
        upsellItemName: parsed.upsellItemName,
        proposedDiscountPct: parsed.proposedDiscountPct,
        originalPrice: parsed.originalPrice,
        discountedPrice: parsed.discountedPrice,
        aiReasoning: parsed.aiReasoning,
        cfoCast: parsed.cfoCast,
        riskScore: parsed.riskScore,
      },
    });
  } catch (error: any) {
    console.error("Gemini upsell error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "AI reasoning failed",
      // Conservative fallback
      decision: {
        upsellItemName: "Brown Butter Chip",
        proposedDiscountPct: 10,
        originalPrice: 4.0,
        discountedPrice: 3.6,
        aiReasoning:
          "AI service temporarily unavailable. Falling back to conservative 10% discount on a complementary cookie. Low risk, proven basket-builder.",
        cfoCast:
          "Fallback: $0.40 discount (≈₹33). Conservative estimate based on segment averages. Minimal budget impact.",
        riskScore: 15,
      },
    });
  }
}
