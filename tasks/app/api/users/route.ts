import { NextResponse } from "next/server";
import { tenantDb } from "@maple/core/lib/tenant-db";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return NextResponse.json(await (await tenantDb()).user.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } })); }
  catch { return NextResponse.json([]); }
}
