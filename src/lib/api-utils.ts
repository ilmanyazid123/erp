// Helper to standardize API error responses.
import { NextResponse } from "next/server";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return NextResponse.json(
    { error: "Unauthorized. Silakan login terlebih dahulu." },
    { status: 401 },
  );
}
