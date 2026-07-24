import { NextResponse } from "next/server";
import { tenantDb } from "@maple/core/lib/tenant-db";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return NextResponse.json(await (await tenantDb()).task.findMany({ orderBy: [{ status: "asc" }, { order: "asc" }, { updatedAt: "desc" }], include: { assignee: { select: { name: true } } } }));
  } catch { return NextResponse.json({ error: "Database not reachable." }, { status: 503 }); }
}
export async function POST(req: Request) {
  const b = await req.json();
  if (!b.title?.trim()) return NextResponse.json({ error: "Title required." }, { status: 400 });
  const db = await tenantDb();
  const status = b.status || "todo";
  const last = await db.task.findFirst({ where: { status }, orderBy: { order: "desc" }, select: { order: true } });
  return NextResponse.json(await db.task.create({ data: {
    title: b.title, description: b.description || null, status,
    priority: b.priority || "medium", assigneeId: b.assigneeId || null,
    dueDate: b.dueDate ? new Date(b.dueDate) : null,
    order: (last?.order ?? -1) + 1,
  } }));
}
