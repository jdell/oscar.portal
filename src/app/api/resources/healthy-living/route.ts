import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import type { Resource } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await api.post<Resource>(
      "/healthy-living-resources",
      body,
    );
    return NextResponse.json(created);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: "Create failed", body: error.body },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Create failed" }, { status: 500 });
  }
}
