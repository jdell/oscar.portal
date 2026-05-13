import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await request.json();
    await api.put(`/surveys/${id}`, body);
    return NextResponse.json({ ok: true });
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
    await api.delete(`/surveys/${id}`);
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
