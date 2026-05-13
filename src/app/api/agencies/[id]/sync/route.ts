import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const result = await api.post<unknown>(`/agencies/${id}/sync`);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: "Sync failed", body: error.body },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Sync failed" }, { status: 500 });
  }
}
