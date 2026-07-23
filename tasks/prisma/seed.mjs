import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

const tenant = await prisma.tenant.upsert({
  where: { slug: "maple" },
  update: { name: "Maple Furnishers", brandName: "MapleOne", domain: "maplefurnishers.com" },
  create: { slug: "maple", name: "Maple Furnishers", brandName: "MapleOne", domain: "maplefurnishers.com" },
});
console.log("seeded tenant MapleOne", tenant.id);

const T = (...names) => names.map((n) => `tool:${n}`);
const roles = [
  { name: "admin", label: "Administrator", permissions: ["*"], isSystem: true },
  { name: "sales", label: "Sales", isSystem: true, permissions: [
    ...T("leads","crm","quotations","orders","invoices","catalog","photoshoot","price-list","inventory","challans","tasks"),
    "act:export", "act:publish",
  ]},
  { name: "accounts", label: "Accounts", isSystem: true, permissions: [
    ...T("crm","invoices","payments","inventory","finance","purchase-orders","expenses","tasks"), "act:export",
  ]},
  { name: "hr", label: "HR", isSystem: true, permissions: [...T("hr","tasks")] },
];
for (const r of roles) {
  await prisma.role.upsert({
    where: { tenantId_name: { tenantId: tenant.id, name: r.name } },
    update: { label: r.label, permissions: r.permissions, isSystem: r.isSystem },
    create: { ...r, tenantId: tenant.id },
  });
  console.log("seeded role", r.name);
}

const users = [
  { name: "Admin", email: process.env.ADMIN_EMAIL || "admin@maplefurnishers.com", password: process.env.ADMIN_PASSWORD || "maple@123", role: "admin" },
  { name: "Sales", email: "sales@maplefurnishers.com", password: "maple@123", role: "sales" },
  { name: "Accounts", email: "accounts@maplefurnishers.com", password: "maple@123", role: "accounts" },
  { name: "HR", email: "hr@maplefurnishers.com", password: "maple@123", role: "hr" },
];
for (const u of users) {
  const passwordHash = await bcrypt.hash(u.password, 10);
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: u.email } },
    update: { name: u.name, role: u.role },
    create: { name: u.name, email: u.email, passwordHash, role: u.role, tenantId: tenant.id },
  });
  console.log("seeded user", u.email, `(${u.role})`);
}

// site CMS: landing page + blocks
const home = await prisma.sitePage.upsert({
  where: { tenantId_slug: { tenantId: tenant.id, slug: "home" } },
  update: {},
  create: { tenantId: tenant.id, slug: "home", title: "Home", order: 0 },
});
if ((await prisma.siteBlock.count({ where: { pageId: home.id } })) === 0) {
  const blocks = [
    ["hero", "Hero", { heading: "Maple Furnishers", body: "Bespoke furniture, crafted in Kirti Nagar." }],
    ["ethos", "Ethos", { heading: "Built to last a lifetime", body: "Restraint, honest materials, and craftsmanship." }],
    ["craft", "Craft", {}],
    ["materials", "Materials", {}],
    ["process", "Process", { heading: "A process you can sit on." }],
    ["anatomy", "Anatomy", { heading: "Apart, then whole" }],
    ["sofa", "Sofa showcase", {}],
    ["table", "Table showcase", {}],
    ["collection", "Collection", { heading: "The collection" }],
    ["visit", "Visit", { heading: "Visit the studio", body: "B-3, W.H.S. Timber Market, Kirti Nagar, Delhi-110015" }],
  ];
  let i = 0;
  for (const [type, label, data] of blocks) {
    await prisma.siteBlock.create({ data: { tenantId: tenant.id, pageId: home.id, type, label, order: i++, data } });
  }
  console.log("seeded site blocks", blocks.length);
}

// backfill any pre-isolation rows to the default tenant
const models = ["client","lead","quotation","invoice","payment","order","inventoryItem","financeEntry","hrDocument","product","collection","shoot","purchaseOrder","deliveryChallan","expense","task","doc"];
for (const m of models) {
  try { const r = await prisma[m].updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }); if (r.count) console.log("backfilled", m, r.count); } catch {}
}
await prisma.$disconnect();
