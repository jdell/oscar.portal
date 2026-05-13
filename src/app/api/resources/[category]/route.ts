import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import type { Resource } from "@/lib/types";

function endpointFor(category: string): string | null {
  if (category === "medical") return "/medical-resources";
  if (category === "healthy_living") return "/healthy-living-resources";
  return null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params;
  const endpoint = endpointFor(category);
  if (!endpoint) {
    return NextResponse.json({ message: "Unknown category" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const created = await api.post<Resource>(endpoint, body);
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
