import { notFound } from "next/navigation";
import { DashboardClient } from "../components/dashboard/DashboardClient";
import { PAGE_IDS, type PageId } from "../lib/api/types";

// "/" is the overview, so only the other four sections get their own URL.
const SECTIONS: PageId[] = PAGE_IDS.filter((page) => page !== "overview");

export const dynamicParams = false;

export function generateStaticParams() {
  return SECTIONS.map((page) => ({ page }));
}

export default async function SectionPage({ params }: { params: Promise<{ page: string }> }) {
  const { page } = await params;
  if (!SECTIONS.includes(page as PageId)) notFound();
  return <DashboardClient page={page as PageId} />;
}
