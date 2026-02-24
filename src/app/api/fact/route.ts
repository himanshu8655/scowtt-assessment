import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function GET(req: Request) {
  try {
    const user = await getUserFromRequest();
    if (!user) {
      return NextResponse.json(
        { code: "UNAUTHENTICATED", message: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!user.favoriteMovie) {
      return NextResponse.json(
        { code: "NO_MOVIE", message: "Favorite movie not set" },
        { status: 400 },
      );
    }

    const url = new URL(req.url);
    const forceNew = url.searchParams.get("forceNew") === "true";

    if (!forceNew) {
      const latestFact = await prisma.fact.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
      });

      if (latestFact) {
        return NextResponse.json({
          fact: latestFact.text,
          createdAt: latestFact.createdAt.toISOString(),
          source: "cache",
        });
      }
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a fun movie fact generator." },
        {
          role: "user",
          content: `Give a short, fun fact about the movie "${user.favoriteMovie}".`,
        },
      ],
    });

    const factText =
      completion.choices[0]?.message?.content?.trim() ||
      `Fun fact about ${user.favoriteMovie}: It is widely loved by movie fans.`;

    const created = await prisma.fact.create({
      data: { userId: user.id, text: factText },
    });

    return NextResponse.json({
      fact: created.text,
      createdAt: created.createdAt.toISOString(),
      source: "generated",
    });
  } catch (error) {
    console.error("API /fact error:", error);
    return NextResponse.json(
      { code: "FACT_ERROR", message: "Failed to generate movie fact" },
      { status: 500 },
    );
  }
}
