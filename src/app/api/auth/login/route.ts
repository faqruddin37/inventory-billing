import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { AuthService } from "@/services/auth.service";
import { loginSchema } from "@/lib/validations/auth.schema";
import { errorResponse, successResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = loginSchema.parse(body);

    const { session } = await AuthService.login(validatedData);

    return successResponse(
      {
        user: session,
      },
      "Logged in successfully",
      200
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Authentication failed";
    return errorResponse(message, 401, message);
  }
}
