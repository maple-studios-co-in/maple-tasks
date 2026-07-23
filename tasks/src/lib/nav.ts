export type NavItem = { tool: string; label: string; href: string };
export const SUITE_DOMAIN = process.env.NEXT_PUBLIC_SUITE_DOMAIN || ".maplefurnishers.com";
export const TOOLS: { tool: string; label: string }[] = [
    // Standalone build: only this app's own tool. Restore the full suite list
    // (leads, crm, orders, …) when this module folds back into maple-suite.
    { tool: "photoshoot", label: "Photoshoot" },
];
export function toolUrl(tool: string): string {
    return `https://${tool}${SUITE_DOMAIN}`;
}
export function adminUrl(path = ""): string {
    return `https://admin${SUITE_DOMAIN}${path}`;
}