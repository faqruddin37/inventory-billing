import { AuthService } from "@/services/auth.service";
import { successResponse } from "@/lib/utils/response";

export async function POST() {
  await AuthService.logout();
  return successResponse(null, "Logged out successfully", 200);
}
