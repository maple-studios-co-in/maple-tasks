"use client";
import React from "react";
import { canAccessTool, ROLE_LABEL } from "../lib/rbac";
import { TOOLS, toolUrl } from "../lib/nav";
import type { SessionUser } from "../lib/session";
import { cn } from "../lib/cn";
import { Avatar } from "./ui/avatar";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "./ui/dropdown-menu";

export function SuiteShell({ user, current, brand, children }: { user: SessionUser; current: string; brand?: { name: string; logoUrl?: string | null }; children: React.ReactNode }) {
    const items = TOOLS.filter((t) => canAccessTool(user.perms, t.tool, user.role));
    const logout = async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login"; };
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-sidebar">
                <a href="/" className="px-5 py-5">
                    {brand?.logoUrl ? <img src={brand.logoUrl} alt={brand.name} className="h-7 w-auto" /> : <div className="font-serif text-2xl text-primary">{brand?.name ?? "MapleOne"}</div>}
                    <div className="mt-0.5 text-[11px] text-muted-foreground">Maple Furnishers · Kirti Nagar</div>
                </a>
                <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
                    {items.map((n) => {
                        const active = n.tool === current;
                        return (
                            <a key={n.tool} href={active ? "/" : toolUrl(n.tool)}
                                className={cn("rounded-md px-3 py-2 text-sm font-medium transition-colors", active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground")}>
                                {n.label}
                            </a>
                        );
                    })}
                </nav>
                <div className="px-5 py-4 text-[10px] text-muted-foreground/70">{ROLE_LABEL[user.role] ?? user.role}</div>
            </aside>
            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur">
                    <h1 className="text-sm font-semibold capitalize text-foreground">{current.replace("-", " ")}</h1>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
                            <Avatar name={user.name} />
                            <div className="hidden text-left sm:block">
                                <div className="text-sm font-medium leading-none text-foreground">{user.name}</div>
                                <div className="mt-0.5 text-[11px] text-muted-foreground">{ROLE_LABEL[user.role] ?? user.role}</div>
                            </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={logout} className="text-destructive">Sign out</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}