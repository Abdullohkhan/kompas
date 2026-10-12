"use client";

import { useCallback, useState } from "react";
import { format, useI18n } from "../../lib/i18n";
import {
  api,
  ApiError,
  authApi,
  toCustomer,
  toMember,
  toReport,
  toUser,
  useFetch,
} from "../../lib/api/client";
import {
  PAGE_IDS,
  type Charts,
  type Customer,
  type PageData,
  type PageId,
  type Report,
  type ReportType,
  type TeamMember,
  type User,
} from "../../lib/api/types";
import { downloadCsv, pageRows, reportRows } from "./export";
import { InsightsModal, NewReportModal, TeamModal, UpgradeModal } from "./Modals";
import { Navbar } from "./Navbar";
import { OverviewPanels } from "./OverviewPanels";
import { Sidebar } from "./Sidebar";
import { StatsGrid } from "./StatsGrid";
import { baseCardClass, secondaryButtonClass } from "./styles";
import { ToastProvider, useToast } from "./ui";
import {
  AnalyticsExtras,
  CustomersView,
  OverviewChart,
  reportName,
  ReportsView,
  SettingsView,
} from "./Views";

type ModalName = "insights" | "team" | "upgrade" | "newReport" | null;

// Module-level so useFetch sees stable references.
const mapUser = (raw: { user: Parameters<typeof toUser>[0] }) => toUser(raw.user);
const mapCustomers = (raw: Parameters<typeof toCustomer>[0][]) => raw.map(toCustomer);
const mapReports = (raw: Parameters<typeof toReport>[0][]) => raw.map(toReport);
const mapMembers = (raw: Parameters<typeof toMember>[0][]) => raw.map(toMember);

function ErrorCard({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className={`${baseCardClass} mt-8 p-8 text-center`}>
      <p className="font-medium text-slate-900 dark:text-slate-100">{t.errors.load}</p>
      <button type="button" onClick={onRetry} className={`${secondaryButtonClass} mt-4`}>
        {t.errors.retry}
      </button>
    </div>
  );
}

function Dashboard() {
  const { t } = useI18n();
  const toast = useToast();
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);

  const user = useFetch<User>("/auth/me", mapUser);
  const page = useFetch<PageData>(`/dashboard/${activePage}`);
  const charts = useFetch<Charts>("/dashboard/charts");
  const customers = useFetch<Customer[]>(activePage === "customers" ? "/customers" : null, mapCustomers);
  const reports = useFetch<Report[]>(activePage === "reports" ? "/reports" : null, mapReports);
  const team = useFetch<TeamMember[]>(activePage === "settings" || modal === "team" ? "/team" : null, mapMembers);

  const closeModal = useCallback(() => setModal(null), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const fail = (error: unknown) => {
    toast(error instanceof ApiError && error.status === 403 ? t.errors.forbidden : t.errors.generic);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      window.location.assign("/login");
    }
  };

  const handleExport = () => {
    if (!page.data) return;
    const file = `pulseboard-${activePage}.csv`;
    downloadCsv(file, pageRows(t, activePage, page.data));
    toast(format(t.export.done, { file }));
  };

  const handleDownloadReport = (report: Report) => {
    downloadCsv(`report-${report.id}.csv`, reportRows(t, report));
    toast(format(t.reports.downloaded, { name: reportName(report, t.reports.names) }));
  };

  const handleCreateReport = async (name: string, type: ReportType) => {
    try {
      await api("/reports", { method: "POST", body: { name, type: type.toUpperCase() } });
      setModal(null);
      setActivePage("reports");
      reports.reload();
      toast(format(t.reports.created, { name }));
    } catch (error) {
      fail(error);
    }
  };

  const handleInvite = async (email: string) => {
    try {
      const res = await api<{ tempPassword: string }>("/team/invite", { method: "POST", body: { email } });
      team.reload();
      toast(format(t.team.invitedTemp, { email, password: res.tempPassword }));
    } catch (error) {
      fail(error);
    }
  };

  const handleSaveProfile = async (data: { name: string; phone: string; company: string }) => {
    try {
      const updated = await authApi.updateProfile(data);
      user.setData(() => updated);
      toast(t.settings.saved);
    } catch (error) {
      fail(error);
    }
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
            user={user.data}
            onLogout={handleLogout}
          />
          <main className="flex-1 p-4 sm:p-7 lg:p-10">
            <div className="mb-5 flex gap-3 md:hidden">
              <button type="button" onClick={handleExport} className={`${secondaryButtonClass} flex-1`}>{t.common.export}</button>
              <button type="button" onClick={() => setModal("newReport")} className={`${secondaryButtonClass} flex-1`}>{t.common.newReport}</button>
            </div>

            {page.error ? (
              <ErrorCard onRetry={page.reload} />
            ) : (
              <>
                {page.data ? (
                  <OverviewPanels
                    page={activePage}
                    data={page.data}
                    userName={user.data?.name ?? ""}
                    onViewInsights={() => setModal("insights")}
                    onManageTeam={() => setModal("team")}
                  />
                ) : (
                  <div aria-busy="true" className={`${baseCardClass} mb-8 h-56 animate-pulse`} />
                )}
                <StatsGrid stats={page.data?.stats ?? []} isLoading={page.loading} />
              </>
            )}

            {activePage === "overview" && charts.data && <OverviewChart charts={charts.data} />}
            {activePage === "analytics" && charts.data && <AnalyticsExtras charts={charts.data} />}
            {activePage === "customers" &&
              (customers.error ? <ErrorCard onRetry={customers.reload} /> : customers.data && <CustomersView customers={customers.data} />)}
            {activePage === "reports" &&
              (reports.error ? (
                <ErrorCard onRetry={reports.reload} />
              ) : (
                reports.data && <ReportsView reports={reports.data} onDownload={handleDownloadReport} onNew={() => setModal("newReport")} />
              ))}
            {activePage === "settings" &&
              user.data &&
              (team.error ? (
                <ErrorCard onRetry={team.reload} />
              ) : (
                team.data && <SettingsView user={user.data} members={team.data} onSaveProfile={handleSaveProfile} onInvite={handleInvite} />
              ))}
          </main>
        </div>
      </div>

      <InsightsModal open={modal === "insights"} onClose={closeModal} page={activePage} />
      <TeamModal open={modal === "team"} onClose={closeModal} members={team.data ?? []} onInvite={handleInvite} />
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

