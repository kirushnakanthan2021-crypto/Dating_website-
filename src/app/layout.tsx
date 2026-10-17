import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pairly — Meet someone real",
  description: "A thoughtful place to meet people and build real connections.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
