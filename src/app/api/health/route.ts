import { connectToDatabase, getDbConnectionStatus } from "@/lib/db/connection";
import { successResponse, errorResponse } from "@/lib/utils/response";

export async function GET() {
  try {
    const conn = await connectToDatabase();
    const status = getDbConnectionStatus();

    return successResponse({
      status: "healthy",
      database: {
        connected: status.isConnected,
        state: status.statusText,
        name: conn.name,
        host: conn.host,
      },
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  } catch (error: unknown) {
    const status = getDbConnectionStatus();
    const message = error instanceof Error ? error.message : "Database check failed";

    return errorResponse(
      {
        status: "unhealthy",
        database: {
          connected: false,
          state: status.statusText,
          error: message,
        },
        timestamp: new Date().toISOString(),
      },
      503,
      "Service Unavailable: Database connection failed"
    );
  }
}
