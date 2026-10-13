"use client";

import { useCallback, useEffect, useState } from "react";
import { format, useI18n } from "../../lib/i18n";
import {
  api,
  ApiError,
  authApi,
  downloadFromApi,
  toCustomer,
  toMember,
  toReport,
  toUser,
  useFetch,
} from "../../lib/api/client";
import {
  PAGE_IDS,
  type BillingStatus,
  type Charts,
  type Customer,
  type PageData,
  type PageId,
  type Report,
  type ReportType,
  type TeamMember,
  type User,
} from "../../lib/api/types";
import { InsightsModal, NewCustomerModal, NewOrderModal, NewReportModal, TeamModal, UpgradeModal, type NewCustomer } from "./Modals";
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

type ModalName = "insights" | "team" | "upgrade" | "newReport" | "newOrder" | "newCustomer" | null;

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

function Dashboard({ page: activePage }: { page: PageId }) {
  const { t } = useI18n();
  const toast = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);

  const user = useFetch<User>("/auth/me", mapUser);
  const billing = useFetch<BillingStatus>("/billing/status");
  const page = useFetch<PageData>(`/dashboard/${activePage}`);
  const charts = useFetch<Charts>(activePage === "overview" || activePage === "analytics" ? "/dashboard/charts" : null);
  const customers = useFetch<Customer[]>(activePage === "customers" || modal === "newOrder" ? "/customers" : null, mapCustomers);
  const reports = useFetch<Report[]>(activePage === "reports" ? "/reports" : null, mapReports);
  const team = useFetch<TeamMember[]>(activePage === "settings" || modal === "team" ? "/team" : null, mapMembers);

  const isAdmin = user.data?.role === "admin";
  const closeModal = useCallback(() => setModal(null), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const reloadBilling = billing.reload;

  // Back from Stripe Checkout: tell the user, then poll briefly while the webhook activates the plan.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("billing");
    if (!result) return;
    window.history.replaceState(null, "", window.location.pathname);
    const timers: number[] = [];
    timers.push(
      window.setTimeout(() => {
        toast(result === "success" ? t.upgrade.success : t.upgrade.cancelled);
      }, 0),
    );
    if (result === "success") {
      for (let i = 1; i <= 5; i++) timers.push(window.setTimeout(reloadBilling, i * 2000));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
    // runs once per mount; the query string is consumed above
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fail = (error: unknown) => {
    if (error instanceof ApiError && error.status === 402) {
      toast(t.errors.planLimit);
      setModal("upgrade");
    } else if (error instanceof ApiError && error.status === 403) {
      toast(error.message === "pro_required" ? t.errors.proRequired : t.errors.forbidden);
      if (error.message === "pro_required") setModal("upgrade");
    } else {
      toast(t.errors.generic);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      window.location.assign("/login");
    }
  };

  const download = async (path: string, fallback: string, doneMessage: (file: string) => string) => {
    try {
      toast(doneMessage(await downloadFromApi(path, fallback)));
    } catch (error) {
      fail(error);
    }
  };

  const handleExport = () =>
    download(`/dashboard/${activePage}/export`, `kompas-${activePage}.csv`, (file) => format(t.export.done, { file }));

  const handleDownloadReport = (report: Report) =>
    download(`/reports/${report.id}/export`, `kompas-report-${report.id}.csv`, () =>
      format(t.reports.downloaded, { name: reportName(report, t.reports.names) }),
    );

  const handleCreateReport = async (name: string, type: ReportType) => {
    try {
      await api("/reports", { method: "POST", body: { name, type: type.toUpperCase() } });
      setModal(null);
      toast(format(t.reports.created, { name }));
      if (activePage === "reports") reports.reload();
      else window.location.assign("/reports");
    } catch (error) {
      fail(error);
    }
  };

  const handleCreateOrder = async (amount: number, customerId?: string) => {
    try {
      const order = await api<{ number: number }>("/orders", { method: "POST", body: { amount, customerId } });
      setModal(null);
      page.reload();
      charts.reload();
      toast(format(t.orders.created, { number: order.number }));
    } catch (error) {
      fail(error);
    }
  };

  const handleCreateCustomer = async (customer: NewCustomer) => {
    try {
      await api("/customers", { method: "POST", body: customer });
      setModal(null);
      customers.reload();
      page.reload();
      toast(format(t.customers.created, { name: customer.name }));
    } catch (error) {
      fail(error);
    }
  };

  const handleRemoveCustomer = async (customer: Customer) => {
    if (!window.confirm(format(t.customers.confirmRemove, { name: customer.name }))) return;
    try {
      await api(`/customers/${customer.id}`, { method: "DELETE" });
      customers.reload();
      page.reload();
      toast(t.customers.removed);
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

  const handleChangePassword = async (current: string, next: string) => {
    try {
      await authApi.changePassword(current, next);
      toast(t.settings.passwordChanged);
      return true;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) toast(t.settings.passwordWrong);
      else fail(error);
      return false;
    }
  };

  const goToStripe = async (path: "/billing/checkout" | "/billing/portal") => {
    try {
      const { url } = await api<{ url: string | null }>(path, { method: "POST" });
      if (url) window.location.assign(url);
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) toast(t.upgrade.unavailable);
      else fail(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_35%),radial-gradient(circle_at_85%_20%,rgba(129,140,248,0.12),transparent_30%)] text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-400 grid-cols-1 lg:grid-cols-[280px_1fr]">
        <Sidebar
          links={PAGE_IDS}
          activeLink={activePage}
          isMobileOpen={mobileOpen}
          onCloseMobile={closeMobile}
          onUpgrade={() => setModal("upgrade")}
          onManageBilling={() => goToStripe("/billing/portal")}
          billing={billing.data}
        />
        <div className="flex min-w-0 flex-col">
          <Navbar
            links={PAGE_IDS}
            activeLink={activePage}
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
                    onNewOrder={isAdmin && activePage === "overview" ? () => setModal("newOrder") : undefined}
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
              (customers.error ? (
                <ErrorCard onRetry={customers.reload} />
              ) : (
                customers.data && (
                  <CustomersView customers={customers.data} isAdmin={isAdmin} onAdd={() => setModal("newCustomer")} onRemove={handleRemoveCustomer} />
                )
              ))}
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
                team.data && (
                  <SettingsView
                    user={user.data}
                    members={team.data}
                    onSaveProfile={handleSaveProfile}
                    onInvite={handleInvite}
                    onChangePassword={handleChangePassword}
                    billing={billing.data}
                    onUpgrade={() => setModal("upgrade")}
                    onManageBilling={() => goToStripe("/billing/portal")}
                  />
                )
              ))}
          </main>
        </div>
      </div>

      <InsightsModal open={modal === "insights"} onClose={closeModal} page={activePage} insights={page.data?.insights ?? []} />
      <TeamModal open={modal === "team"} onClose={closeModal} members={team.data ?? []} onInvite={handleInvite} />
      <UpgradeModal open={modal === "upgrade"} onClose={closeModal} onStart={() => goToStripe("/billing/checkout")} />
      <NewReportModal open={modal === "newReport"} onClose={closeModal} onCreate={handleCreateReport} />
      <NewOrderModal open={modal === "newOrder"} onClose={closeModal} customers={customers.data ?? []} onCreate={handleCreateOrder} />
      <NewCustomerModal open={modal === "newCustomer"} onClose={closeModal} onCreate={handleCreateCustomer} />
    </div>
  );
}

export function DashboardClient({ page }: { page: PageId }) {
  return (
    <ToastProvider>
      <Dashboard page={page} />
    </ToastProvider>
  );
}
