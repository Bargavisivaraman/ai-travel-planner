import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateSchema } from "@/lib/validations";
import { generateItinerary } from "@/lib/ai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = generateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const itinerary = await generateItinerary(parsed.data);
    return NextResponse.json(itinerary);
  } catch (err) {
    console.error("generate error", err);
    return NextResponse.json(
      { error: "Failed to generate itinerary" },
      { status: 500 }
    );
  }
}
