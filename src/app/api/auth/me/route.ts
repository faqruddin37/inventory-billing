import { AuthService } from "@/services/auth.service";
import { errorResponse, successResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const session = await AuthService.getCurrentOwner();
    const isConfigured = await AuthService.isOwnerConfigured();

    return successResponse({
      authenticated: !!session,
      user: session,
      isConfigured,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch session";
    return errorResponse(message, 500);
  }
}
