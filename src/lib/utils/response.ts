import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | Record<string, unknown>;
  statusCode: number;
}

export function successResponse<T>(data: T, message?: string, statusCode = 200) {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      statusCode,
    },
    { status: statusCode }
  );
}

export function errorResponse(
  error: string | Record<string, unknown>,
  statusCode = 400,
  message?: string
) {
  return NextResponse.json(
    {
      success: false,
      message: message || (typeof error === "string" ? error : "An error occurred"),
      error,
      statusCode,
    },
    { status: statusCode }
  );
}
