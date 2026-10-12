"use client";

import { useCallback, useEffect, useState } from "react";
import { format, useI18n } from "../../lib/i18n";
import {
  fetchPageData,
  INITIAL_REPORTS,
  PAGE_DATA,
  PAGE_IDS,
  type PageData,
  type PageId,
  type Report,
  type ReportType,
} from "../../lib/mock";
import { downloadCsv, pageRows, reportRows } from "./export";
import { InsightsModal, NewReportModal, TeamModal, UpgradeModal } from "./Modals";
import { Navbar } from "./Navbar";
import { OverviewPanels } from "./OverviewPanels";
import { Sidebar } from "./Sidebar";
import { StatsGrid } from "./StatsGrid";
import { secondaryButtonClass } from "./styles";
import { ToastProvider, useToast } from "./ui";
import {
  AnalyticsExtras,
  CustomersView,
  OverviewChart,
  reportName,
  ReportsView,
  SettingsView,
} from "./Views";

type Loaded = { page: PageId; data: PageData } | null;
type ModalName = "insights" | "team" | "upgrade" | "newReport" | null;

function Dashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [loaded, setLoaded] = useState<Loaded>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);

  useEffect(() => {
    let current = true;
    fetchPageData(activePage).then((data) => {
      if (current) setLoaded({ page: activePage, data });
    });
    return () => {
      current = false;
    };
  }, [activePage]);

  const closeModal = useCallback(() => setModal(null), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Stats are "loading" whenever the last loaded page differs from the selected one.
  const isLoading = loaded?.page !== activePage;

  const handleExport = () => {
    const file = `pulseboard-${activePage}.csv`;
    downloadCsv(file, pageRows(t, activePage));
    toast(format(t.export.done, { file }));
  };

  const handleDownloadReport = (report: Report) => {
    const name = reportName(report, t.reports.names);
    downloadCsv(`report-${report.id}.csv`, reportRows(t, report));
    toast(format(t.reports.downloaded, { name }));
  };

  const handleCreateReport = (name: string, type: ReportType) => {
    const report: Report = {
      id: `r${Date.now()}`,
      customName: name,
      type,
      status: "ready",
      createdAt: new Date().toISOString().slice(0, 10),
      rows: 0,
    };
    setReports((prev) => [report, ...prev]);
    setModal(null);
    setActivePage("reports");
    toast(format(t.reports.created, { name }));
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(129,140,248,0.12),transparent_30%)] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-400 grid-cols-1 lg:grid-cols-[280px_1fr]">
        <Sidebar
          links={PAGE_IDS}
          activeLink={activePage}
          onSelectLink={setActivePage}
          isMobileOpen={mobileOpen}
          onCloseMobile={closeMobile}
          onUpgrade={() => setModal("upgrade")}
        />
        <div className="flex min-w-0 flex-col">
          <Navbar
            links={PAGE_IDS}
            activeLink={activePage}
            onSelectLink={setActivePage}
            onToggleMobileMenu={() => setMobileOpen((open) => !open)}
            onExport={handleExport}
            onNewReport={() => setModal("newReport")}
          />
          <main className="flex-1 p-4 sm:p-7 lg:p-10">
            <div className="mb-5 flex gap-3 md:hidden">
              <button type="button" onClick={handleExport} className={`${secondaryButtonClass} flex-1`}>{t.common.export}</button>
              <button type="button" onClick={() => setModal("newReport")} className={`${secondaryButtonClass} flex-1`}>{t.common.newReport}</button>
            </div>
            <OverviewPanels
              page={activePage}
              data={PAGE_DATA[activePage]}
              onViewInsights={() => setModal("insights")}
              onManageTeam={() => setModal("team")}
            />
            <StatsGrid stats={loaded && !isLoading ? loaded.data.stats : []} isLoading={isLoading} />

            {activePage === "overview" && <OverviewChart />}
            {activePage === "analytics" && <AnalyticsExtras />}
            {activePage === "customers" && <CustomersView />}
            {activePage === "reports" && (
              <ReportsView reports={reports} onDownload={handleDownloadReport} onNew={() => setModal("newReport")} />
            )}
            {activePage === "settings" && <SettingsView />}

            <p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">{t.common.demoNote}</p>
          </main>
        </div>
      </div>

      <InsightsModal open={modal === "insights"} onClose={closeModal} page={activePage} />
      <TeamModal open={modal === "team"} onClose={closeModal} />
      <UpgradeModal
        open={modal === "upgrade"}
        onClose={closeModal}
        onStart={() => {
          setModal(null);
          toast(t.upgrade.started);
        }}
      />
      <NewReportModal open={modal === "newReport"} onClose={closeModal} onCreate={handleCreateReport} />
    </div>
  );
}

export function DashboardClient() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
