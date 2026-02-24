import { prisma } from "./prisma";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

interface SessionPayload {
  uid: string;
}

export async function getUserFromRequest() {
  try {
    const token = (await cookies()).get("session")?.value;
    if (!token) return null;
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as SessionPayload;
    return await prisma.user.findUnique({ where: { uid: decoded.uid } });
  } catch (error) {
    console.error("Auth error:", error);
    return null;
  }
}
