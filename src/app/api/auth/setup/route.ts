import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { AuthService } from "@/services/auth.service";
import { setupOwnerSchema } from "@/lib/validations/auth.schema";
import { errorResponse, successResponse } from "@/lib/utils/response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = setupOwnerSchema.parse(body);

    const { session } = await AuthService.setupInitialOwner(validatedData);

    return successResponse(
      {
        user: session,
      },
      "Owner account initialized successfully",
      201
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Initialization failed";
    return errorResponse(message, 400, message);
  }
}
