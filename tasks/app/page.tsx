"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { PageHeader } from "@maple/core/components/PageHeader";
import { Card } from "@maple/core/ui/card";
import { Input, Select } from "@maple/core/ui/input";
import { Button } from "@maple/core/ui/button";
import { Badge } from "@maple/core/ui/badge";

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  order: number;
  assigneeId: string | null;
  dueDate: string | null;
  assignee: { name: string } | null;
};
type U = { id: string; name: string };
const COLS = [
  { id: "todo", label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
] as const;
const PV: Record<string, "neutral" | "info" | "warning" | "danger"> = { low: "neutral", medium: "info", high: "danger" };

function buildContainers(rows: Task[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const col of COLS) {
    map[col.id] = rows
      .filter((t) => t.status === col.id)
      .sort((a, b) => a.order - b.order)
      .map((t) => t.id);
  }
  return map;
}

function applyContainerOrder(rows: Task[], containers: Record<string, string[]>): Task[] {
  const byId = new Map(rows.map((t) => [t.id, { ...t }]));
  const result: Task[] = [];
  for (const col of COLS) {
    for (const [index, id] of (containers[col.id] ?? []).entries()) {
      const task = byId.get(id);
      if (task) result.push({ ...task, status: col.id, order: index });
    }
  }
  for (const t of rows) {
    if (!result.some((r) => r.id === t.id)) result.push(t);
  }
  return result;
}

function TaskCardContent({
  task,
  onRemove,
  onMoveLeft,
  onMoveRight,
  showLeft,
  showRight,
}: {
  task: Task;
  onRemove?: () => void;
  onMoveLeft?: () => void;
  onMoveRight?: () => void;
  showLeft?: boolean;
  showRight?: boolean;
}) {
  const overdue = task.status !== "done" && task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-foreground">{task.title}</span>
        {onRemove && (
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={onRemove}
            className="text-muted-foreground/40 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
          >
            ×
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={PV[task.priority]}>{task.priority}</Badge>
        {task.assignee && <span className="text-[11px] text-muted-foreground">{task.assignee.name}</span>}
        {task.dueDate && (
          <span className={overdue ? "text-[11px] font-medium text-destructive" : "text-[11px] text-muted-foreground"}>
            {new Date(task.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>
      {(showLeft || showRight) && (
        <div className="mt-2 flex gap-1">
          {showLeft && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onMoveLeft}
              className="flex-1 rounded border border-border py-1 text-[11px] text-muted-foreground hover:bg-accent"
            >
              ←
            </button>
          )}
          {showRight && (
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onMoveRight}
              className="flex-1 rounded border border-border py-1 text-[11px] font-medium text-foreground hover:bg-accent"
            >
              →
            </button>
          )}
        </div>
      )}
    </>
  );
}

function SortableTaskCard({
  task,
  colIndex,
  onRemove,
  onMoveStatus,
}: {
  task: Task;
  colIndex: number;
  onRemove: (id: string) => void;
  onMoveStatus: (id: string, status: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.35 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
      <Card className="group cursor-grab p-3 active:cursor-grabbing">
        <TaskCardContent
          task={task}
          onRemove={() => onRemove(task.id)}
          showLeft={colIndex > 0}
          showRight={colIndex < COLS.length - 1}
          onMoveLeft={() => onMoveStatus(task.id, COLS[colIndex - 1].id)}
          onMoveRight={() => onMoveStatus(task.id, COLS[colIndex + 1].id)}
        />
      </Card>
    </div>
  );
}

function KanbanColumn({
  col,
  colIndex,
  taskIds,
  tasksById,
  onRemove,
  onMoveStatus,
}: {
  col: (typeof COLS)[number];
  colIndex: number;
  taskIds: string[];
  tasksById: Map<string, Task>;
  onRemove: (id: string) => void;
  onMoveStatus: (id: string, status: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div className="flex flex-col rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{col.label}</span>
        <span className="rounded-full bg-card px-2 py-0.5 text-[11px] text-muted-foreground">{taskIds.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2 p-2 transition-colors ${isOver ? "bg-accent/30 ring-1 ring-inset ring-primary/20" : ""}`}
      >
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {taskIds.length === 0 && <div className="px-2 py-6 text-center text-xs text-muted-foreground/60">—</div>}
          {taskIds.map((id) => {
            const task = tasksById.get(id);
            if (!task) return null;
            return (
              <SortableTaskCard
                key={id}
                task={task}
                colIndex={colIndex}
                onRemove={onRemove}
                onMoveStatus={onMoveStatus}
              />
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [rows, setRows] = useState<Task[]>([]);
  const [users, setUsers] = useState<U[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: "", assigneeId: "", priority: "medium", dueDate: "" });
  const [activeId, setActiveId] = useState<string | null>(null);

  const containerIds = useMemo(() => buildContainers(rows), [rows]);
  const [containers, setContainers] = useState(containerIds);
  const containersRef = useRef(containerIds);

  useEffect(() => {
    if (!activeId) {
      setContainers(containerIds);
      containersRef.current = containerIds;
    }
  }, [containerIds, activeId]);

  const tasksById = useMemo(() => new Map(rows.map((t) => [t.id, t])), [rows]);
  const activeTask = activeId ? tasksById.get(activeId) : undefined;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/tasks");
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setError(j.error || "Could not load.");
        setRows([]);
      } else {
        setError(null);
        const data: Task[] = await r.json();
        setRows(data.map((t) => ({ ...t, order: t.order ?? 0 })));
      }
    } catch {
      setError("Could not reach the server.");
    } finally {
      setLoading(false);
    }
  };
  const loadUsers = async () => {
    try {
      const r = await fetch("/api/users");
      if (r.ok) setUsers(await r.json());
    } catch {}
  };
  useEffect(() => {
    load();
    loadUsers();
  }, []);

  const persistChanges = async (nextRows: Task[]) => {
    const prev = rows;
    setRows(nextRows);
    const changes = nextRows.filter((t) => {
      const o = prev.find((p) => p.id === t.id);
      return o && (o.status !== t.status || o.order !== t.order);
    });
    if (changes.length === 0) return;
    try {
      const results = await Promise.all(
        changes.map((t) =>
          fetch(`/api/tasks/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: t.status, order: t.order }),
          }),
        ),
      );
      if (results.some((r) => !r.ok)) throw new Error("patch failed");
    } catch {
      setRows(prev);
      setError("Could not save task order.");
    }
  };

  const patch = async (id: string, d: Partial<Task>) => {
    await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) });
    load();
  };

  const moveStatus = (id: string, status: string) => {
    const order = (containers[status]?.length ?? 0);
    patch(id, { status, order });
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const r = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (r.ok) {
      setForm({ title: "", assigneeId: "", priority: "medium", dueDate: "" });
      load();
    }
  };
  const remove = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    load();
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = String(active.id);
    const overId = String(over.id);

    setContainers((prev) => {
      const findIn = (id: string) => {
        if (COLS.some((c) => c.id === id)) return id;
        return COLS.find((c) => prev[c.id]?.includes(id))?.id;
      };
      const activeContainer = findIn(activeTaskId);
      const overContainer = findIn(overId);
      if (!activeContainer || !overContainer || activeContainer === overContainer) return prev;

      const activeItems = [...prev[activeContainer]];
      const overItems = [...prev[overContainer]];
      const activeIndex = activeItems.indexOf(activeTaskId);
      if (activeIndex === -1) return prev;

      activeItems.splice(activeIndex, 1);
      const overIndex = overItems.indexOf(overId);
      const newIndex = overIndex >= 0 ? overIndex : overItems.length;
      overItems.splice(newIndex, 0, activeTaskId);

      const next = { ...prev, [activeContainer]: activeItems, [overContainer]: overItems };
      containersRef.current = next;
      return next;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) {
      setContainers(containerIds);
      containersRef.current = containerIds;
      return;
    }

    const activeTaskId = String(active.id);
    const overId = String(over.id);
    let nextContainers = containersRef.current;

    const findIn = (map: Record<string, string[]>, id: string) => {
      if (COLS.some((c) => c.id === id)) return id;
      return COLS.find((c) => map[c.id]?.includes(id))?.id;
    };

    const activeContainer = findIn(nextContainers, activeTaskId);
    const overContainer = findIn(nextContainers, overId);
    if (!activeContainer || !overContainer) return;

    if (activeContainer === overContainer && activeTaskId !== overId) {
      const items = nextContainers[activeContainer];
      const oldIndex = items.indexOf(activeTaskId);
      const newIndex = items.indexOf(overId);
      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        nextContainers = { ...nextContainers, [activeContainer]: arrayMove(items, oldIndex, newIndex) };
        containersRef.current = nextContainers;
        setContainers(nextContainers);
      }
    }

    persistChanges(applyContainerOrder(rows, nextContainers));
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setContainers(containerIds);
    containersRef.current = containerIds;
  };

  const activeColIndex = activeTask ? COLS.findIndex((c) => c.id === activeTask.status) : -1;

  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Tasks" description={`${rows.filter((t) => t.status !== "done").length} open · ${rows.length} total`} />
      <Card className="mb-6 p-3">
        <form onSubmit={add} className="grid grid-cols-1 gap-2 sm:grid-cols-5">
          <Input className="sm:col-span-2" placeholder="Task title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </Select>
          <Select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <div className="flex gap-2">
            <Input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <Button type="submit">Add</Button>
          </div>
        </form>
      </Card>
      {error && <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{error}</div>}
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading…</div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {COLS.map((col, colIndex) => (
              <KanbanColumn
                key={col.id}
                col={col}
                colIndex={colIndex}
                taskIds={containers[col.id] ?? []}
                tasksById={tasksById}
                onRemove={remove}
                onMoveStatus={moveStatus}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 200, easing: "ease" }}>
            {activeTask ? (
              <Card className="group cursor-grabbing p-3 shadow-lg ring-2 ring-primary/20">
                <TaskCardContent
                  task={activeTask}
                  showLeft={activeColIndex > 0}
                  showRight={activeColIndex >= 0 && activeColIndex < COLS.length - 1}
                />
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
