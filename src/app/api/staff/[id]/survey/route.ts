import { NextResponse } from "next/server";
import { api, ApiError } from "@/lib/api";
import type { StaffMember } from "@/lib/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as { isSurveyEnabled: boolean };
    const current = await api.get<StaffMember>(`/staff-members/${id}`);
    const updated = await api.put<StaffMember>(`/staff-members/${id}`, {
      ...current,
      isSurveyEnabled: Boolean(body.isSurveyEnabled),
    });
    return NextResponse.json(updated ?? { id, isSurveyEnabled: body.isSurveyEnabled });
  } catch (error) {
    if (error instanceof ApiError) {
      return NextResponse.json(
        { message: "Toggle failed", body: error.body },
        { status: error.status },
      );
    }
    return NextResponse.json({ message: "Toggle failed" }, { status: 500 });
  }
}
