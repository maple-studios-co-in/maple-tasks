"use client";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@maple/core/components/PageHeader";
import { Card } from "@maple/core/ui/card";
import { Input, Select } from "@maple/core/ui/input";
import { Button } from "@maple/core/ui/button";
import { Badge } from "@maple/core/ui/badge";

type Task = { id: string; title: string; status: string; priority: string; assigneeId: string | null; dueDate: string | null; assignee: { name: string } | null };
type U = { id: string; name: string };
const COLS = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
] as const;
const PV: Record<string, "neutral" | "info" | "warning" | "danger"> = { low: "neutral", medium: "info", high: "danger" };

export default function TasksPage() {
  const [rows, setRows] = useState<Task[]>([]);
  const [users, setUsers] = useState<U[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", assigneeId: "", priority: "medium", dueDate: "" });

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/tasks");
      if (!r.ok) { const j = await r.json().catch(() => ({})); setError(j.error || "Could not load."); setRows([]); }
      else { setError(null); setRows(await r.json()); }
    } catch { setError("Could not reach the server."); } finally { setLoading(false); }
  };
  const loadUsers = async () => { try { const r = await fetch("/api/users"); if (r.ok) setUsers(await r.json()); } catch {} };
  useEffect(() => { load(); loadUsers(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.title.trim()) return;
    const r = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) { setForm({ title: "", assigneeId: "", priority: "medium", dueDate: "" }); load(); }
  };
  const patch = async (id: string, d: Partial<Task>) => { await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }); load(); };
  const remove = async (id: string) => { await fetch(`/api/tasks/${id}`, { method: "DELETE" }); load(); };
  const idx = (s: string) => COLS.findIndex((c) => c.id === s);

  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Tasks" description={`${rows.filter((t) => t.status !== "done").length} open · ${rows.length} total`} />
      <Card className="mb-6 p-3">
        <form onSubmit={add} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <Input className="sm:col-span-2" placeholder="Task title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}><option value="">Unassigned</option>{users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</Select>
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select>
          <div className="flex gap-2"><Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /><Button type="submit">Add</Button></div>
        </form>
      </Card>
      {error && <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}
      {loading ? <div className="py-8 text-center text-muted-foreground">Loading…</div> : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {COLS.map((col) => {
            const items = rows.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col rounded-lg border border-border bg-muted/30">
                <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
                  <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{col.label}</span>
                  <span className="rounded-full bg-card px-2 py-0.5 text-[11px] text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex-1 space-y-2 p-2">
                  {items.length === 0 && <div className="px-2 py-6 text-center text-xs text-muted-foreground/60">—</div>}
                  {items.map((t) => {
                    const overdue = t.status !== "done" && t.dueDate && new Date(t.dueDate) < new Date();
                    return (
                      <Card key={t.id} className="group p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-foreground">{t.title}</span>
                          <button onClick={() => remove(t.id)} className="text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100">×</button>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge variant={PV[t.priority]}>{t.priority}</Badge>
                          {t.assignee && <span className="text-[11px] text-muted-foreground">{t.assignee.name}</span>}
                          {t.dueDate && <span className={overdue ? "text-[11px] font-medium text-destructive" : "text-[11px] text-muted-foreground"}>{new Date(t.dueDate).toLocaleDateString()}</span>}
                        </div>
                        <div className="mt-2 flex gap-1">
                          {idx(t.status) > 0 && <button onClick={() => patch(t.id, { status: COLS[idx(t.status) - 1].id })} className="flex-1 rounded border border-border py-1 text-[11px] text-muted-foreground hover:bg-accent">←</button>}
                          {idx(t.status) < COLS.length - 1 && <button onClick={() => patch(t.id, { status: COLS[idx(t.status) + 1].id })} className="flex-1 rounded border border-border py-1 text-[11px] font-medium text-foreground hover:bg-accent">→</button>}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
