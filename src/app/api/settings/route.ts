import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { SettingsService } from "@/services/settings.service";
import { shopSettingsSchema } from "@/lib/validations/settings.schema";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const settings = await SettingsService.getSettings();
    return successResponse(settings);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch settings";
    return errorResponse(message, 500);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = shopSettingsSchema.parse(body);

    const updated = await SettingsService.updateSettings(validatedData);

    return successResponse(updated, "Shop settings saved successfully");
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return errorResponse(error.format() as unknown as Record<string, unknown>, 400, "Validation error");
    }
    const message = error instanceof Error ? error.message : "Failed to update settings";
    return errorResponse(message, 400, message);
  }
}
