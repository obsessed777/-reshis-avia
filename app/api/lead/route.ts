import { NextResponse } from "next/server";

export function POST() {
  return NextResponse.json({ error: "Форма временно недоступна" }, { status: 503 });
}
