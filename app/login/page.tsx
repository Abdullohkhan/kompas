"use client";

import { useState } from "react";
import { Logo } from "../components/Logo";
import { ApiError, authApi, useFetch } from "../lib/api/client";
import { useI18n } from "../lib/i18n";
import { LanguageSwitcher, ThemeToggle } from "../components/dashboard/Switchers";
import { baseCardClass, inputClass, mutedTextClass, primaryButtonClass } from "../components/dashboard/styles";

export default function LoginPage() {
  const { t } = useI18n();
  const config = useFetch<{ registration: boolean }>("/auth/config");
  const canRegister = config.data?.registration === true;
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "login") await authApi.login(email, password);
      else await authApi.register(name, email, password);
      window.location.assign("/");
    } catch (e) {
      const status = e instanceof ApiError ? e.status : 0;
      setError(
        status === 401 ? t.auth.invalid
        : status === 409 ? t.auth.exists
        : status === 429 ? t.auth.tooMany
        : status === 403 ? t.auth.disabled
        : t.auth.failed,
      );
      setBusy(false);
    }
  };

  const isLogin = mode === "login" || !canRegister;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <form onSubmit={submit} className={`${baseCardClass} w-full max-w-sm space-y-4 p-6 shadow-xl sm:p-8`}>
        <div className="flex items-center gap-3">
          <Logo size={32} className="rounded-lg" />
          <p className="text-lg font-semibold tracking-tight">{t.brand}</p>
        </div>
        <div>
          <h1 className="text-xl font-semibold">{isLogin ? t.auth.loginTitle : t.auth.registerTitle}</h1>
          <p className={`mt-1 text-sm ${mutedTextClass}`}>{t.auth.subtitle}</p>
        </div>
        {!isLogin && (
          <label className="block text-sm">
            <span className={mutedTextClass}>{t.auth.name}</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} className={`${inputClass} mt-1`} />
          </label>
        )}
        <label className="block text-sm">
          <span className={mutedTextClass}>{t.auth.email}</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={`${inputClass} mt-1`} />
        </label>
        <label className="block text-sm">
          <span className={mutedTextClass}>{t.auth.password}</span>
          <input
            type="password"
            required
            minLength={isLogin ? undefined : 8}
            maxLength={72}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? "current-password" : "new-password"}
            className={`${inputClass} mt-1`}
          />
          {!isLogin && <span className={`mt-1 block text-xs ${mutedTextClass}`}>{t.auth.passwordHint}</span>}
        </label>
        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full disabled:opacity-60`}>
          {isLogin ? t.auth.signIn : t.auth.signUp}
        </button>
        {canRegister ? (
          <p className={`text-center text-sm ${mutedTextClass}`}>
            {isLogin ? t.auth.noAccount : t.auth.haveAccount}{" "}
            <button
              type="button"
              onClick={() => {
                setMode(isLogin ? "register" : "login");
                setError(null);
              }}
              className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-300"
            >
              {isLogin ? t.auth.signUp : t.auth.signIn}
            </button>
          </p>
        ) : (
          <p className={`text-center text-xs ${mutedTextClass}`}>{t.auth.inviteOnly}</p>
        )}
      </form>
    </main>
  );
}
