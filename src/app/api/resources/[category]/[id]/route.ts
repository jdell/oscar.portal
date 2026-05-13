import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import type { Resource } from "@/lib/types";

function endpointFor(category: string): string | null {
  if (category === "medical") return "/medical-resources";
  if (category === "healthy_living") return "/healthy-living-resources";
  return null;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ category: string; id: string }> },
) {
  const { category, id } = await params;
  const endpoint = endpointFor(category);
  if (!endpoint) {
    return NextResponse.json({ message: "Unknown category" }, { status: 400 });
  }
  try {
    const body = await request.json();
    const updated = await api.put<Resource>(`${endpoint}/${id}`, body);
    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: "Update failed", body: error.body },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}
