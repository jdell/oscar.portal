import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import type { Location } from "@/lib/types";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await api.put<Location>(`/class-locations/${id}`, body);
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await api.delete(`/class-locations/${id}`);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: "Delete failed" },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
