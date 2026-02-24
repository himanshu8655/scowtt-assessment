import { NextRequest, NextResponse } from "next/server";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = (await req.json()) as { idToken?: string };

    if (!idToken) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Missing idToken" },
        { status: 400 },
      );
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    if (!email) {
      return NextResponse.json(
        { code: "BAD_REQUEST", message: "Google account email is required" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { uid } });
    const firstTime = !existingUser;

    const user =
      existingUser ??
      (await prisma.user.create({
        data: {
          uid,
          email,
          name: name ?? null,
          image: picture ?? null,
        },
      }));

    const token = jwt.sign({ uid: user.uid }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    const response = NextResponse.json({ success: true, firstTime });
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Auth failed:", error);
    return NextResponse.json(
      { code: "UNAUTHENTICATED", message: "Authentication failed" },
      { status: 401 },
    );
  }
}
