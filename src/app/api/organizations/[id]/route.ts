import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    const updated = await api.put(`/organizations/${id}`, body);
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
