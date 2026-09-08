import { SignJWT, jwtVerify } from "jose";
import { UserSession } from "@/types/auth.types";

const JWT_SECRET = process.env.JWT_SECRET || "default_dev_secret_replace_in_production_key_123456";
const encodedKey = new TextEncoder().encode(JWT_SECRET);

export interface TokenPayload extends UserSession {
  exp?: number;
  iat?: number;
}

/**
 * Signs a JWT token for the owner session (default: 7 days validity)
 */
export async function signToken(payload: UserSession, expiresIn = "7d"): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedKey);
}

/**
 * Verifies a JWT token and returns the payload
 */
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}
