import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function PUT(req: Request) {
  const user = await getUserFromRequest();
  if (!user) {
    return NextResponse.json(
      { code: "UNAUTHENTICATED", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const body = (await req.json()) as { favoriteMovie?: string };
  const movie = body.favoriteMovie?.trim();

  if (!movie || movie.length < 2 || movie.length > 100) {
    return NextResponse.json(
      {
        code: "VALIDATION_ERROR",
        message: "Favorite movie must be between 2 and 100 characters",
      },
      { status: 400 },
    );
  }

  const updatedUser = await prisma.user.update({
    where: { uid: user.uid },
    data: { favoriteMovie: movie },
  });

  return NextResponse.json({ favoriteMovie: updatedUser.favoriteMovie });
}
