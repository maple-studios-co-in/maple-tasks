import { NextResponse } from "next/server";
import { tenantDb } from "@maple/core/lib/tenant-db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await (await tenantDb()).task.findMany({ orderBy: { updatedAt: "desc" }, include: { assignee: { select: { name: true } } } }));
  } catch { return NextResponse.json({ error: "Database not reachable." }, { status: 503 }); }
}
export async function POST(req: Request) {
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: "Title required." }, { status: 400 });
  return NextResponse.json(await (await tenantDb()).task.create({ data: {
    title: b.title, description: b.description || null, status: b.status || "todo",
    priority: b.priority || "medium", assigneeId: b.assigneeId || null,
    dueDate: b.dueDate ? new Date(b.dueDate) : null,
  } }));
}
