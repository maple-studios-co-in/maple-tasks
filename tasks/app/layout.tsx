import type { Metadata } from "next";
import { Outfit, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { redirect } from "next/navigation";
import { getSession } from "@maple/core/lib/auth";
import { adminUrl } from "@maple/core/lib/nav";
import { SuiteShell } from "@maple/core/components/SuiteShell";
import { getBrand } from "@maple/core/lib/brand";
import { ToolDisabled } from "@maple/core/components/ToolDisabled";
import { isEnabled } from "@maple/core/lib/flags";

const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });
const instrument = Instrument_Serif({ variable: "--font-instrument", weight: "400", subsets: ["latin"] });
export const metadata: Metadata = { title: "Tasks · MapleOne" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getSession();
  const brand = await getBrand();

  if (process.env.NODE_ENV !== "development" && !user) {
    redirect(adminUrl("/login"));
  }

  const toolOn =
    process.env.NODE_ENV === "development"
      ? true
      : await isEnabled("tool.tasks");
  return (
    <html lang="en" className={`${outfit.variable} ${instrument.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full">
        {toolOn ? (<SuiteShell
          user={
            user ?? {
              id: "local-dev",
              name: "Local Developer",
              email: "local@maple.dev",
              role: "admin",
              perms: ["*"],
            }
          }
          brand={brand}
          current="tasks"
        >
          {children}
        </SuiteShell>) : (<ToolDisabled label="Tasks" />)}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
