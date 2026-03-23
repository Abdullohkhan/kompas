"use client";

import { useEffect, useMemo, useState } from "react";
import { DASHBOARD_CONTENT, SIDEBAR_LINKS } from "./data";
import { Navbar } from "./Navbar";
import { OverviewPanels } from "./OverviewPanels";
import { Sidebar } from "./Sidebar";
import { StatsGrid } from "./StatsGrid";
import { fetchStatsByPage } from "./stats-api";
import type { DashboardPage, Stat } from "./types";

export function DashboardClient() {
  const [activePage, setActivePage] = useState<DashboardPage>("Overview");
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [stats, setStats] = useState<Stat[]>([]);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const currentContent = useMemo(() => DASHBOARD_CONTENT[activePage], [activePage]);
  useEffect(() => {
    const storedTheme = window.localStorage.getItem("dashboard-theme");
    const initialTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : "dark";
    setTheme(initialTheme);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("dashboard-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileSidebarOpen]);

  useEffect(() => {
    let isCurrent = true;
    setIsLoadingStats(true);

    fetchStatsByPage(activePage).then((fetchedStats) => {
      if (!isCurrent) {
        return;
      }
      setStats(fetchedStats);
      setIsLoadingStats(false);
    });

    return () => {
      isCurrent = false;
    };
  }, [activePage]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "dark" ? "light" : "dark"));
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(129,140,248,0.12),transparent_30%)] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-400 grid-cols-1 lg:grid-cols-[280px_1fr]">
        <Sidebar
          links={SIDEBAR_LINKS}
          activeLink={activePage}
          onSelectLink={setActivePage}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
        <div className="flex min-w-0 flex-col">
          <Navbar
            links={SIDEBAR_LINKS}
            activeLink={activePage}
            onSelectLink={setActivePage}
            theme={theme}
            onToggleTheme={toggleTheme}
            onToggleMobileMenu={() => setIsMobileSidebarOpen((prevState) => !prevState)}
          />
          <main className="flex-1 p-5 sm:p-7 lg:p-10">
            <OverviewPanels
              heroTitle={currentContent.heroTitle}
              heroDescription={currentContent.heroDescription}
              monthlyGoal={currentContent.monthlyGoal}
              goalProgress={currentContent.goalProgress}
              trafficSources={currentContent.trafficSources}
              recentActivity={currentContent.recentActivity}
            />
            <StatsGrid stats={stats} isLoading={isLoadingStats} />
          </main>
        </div>
      </div>
    </div>
  );
}
