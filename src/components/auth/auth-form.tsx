"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, ShieldCheck, Lock, FileText } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import { useUser } from "@/components/providers/user-provider";

const isGmail = (e: string) => /^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i.test(e.trim());

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/dashboard";
  const { refresh } = useUser();

  const [step, setStep] = useState<"details" | "code">("details");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"otp" | "password">("otp");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === "code") codeRef.current?.focus();
  }, [step]);

  const passwordOk = mode === "login" || method === "otp" || password.length >= 8;
  const canSend = isGmail(email) && (mode === "login" || name.trim().length > 0) && passwordOk;

  const passwordLogin = async () => {
    setError(null);
    if (!isGmail(email)) return setError("Please use a Gmail address (name@gmail.com)");
    if (!password) return setError("Enter your password");
    setLoading(true);
    try {
      await apiFetch("/api/auth/password/login", { method: "POST", body: JSON.stringify({ email: email.trim(), password }) });
      await refresh();
      toast.success("Welcome back");
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const sendCode = async () => {
    setError(null);
    if (mode === "signup" && !name.trim()) return setError("Please enter your full name");
    if (!isGmail(email)) return setError("Please use a Gmail address (name@gmail.com)");
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string }>("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), purpose: mode, name: name.trim(), businessName: businessName.trim() }),
      });
      setToken(res.token);
      setStep("code");
      setCooldown(60);
      toast.success("Code sent — check your Gmail (and spam)");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      await apiFetch("/api/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), purpose: mode, code, token, name: name.trim(), businessName: businessName.trim(), password: mode === "signup" && method === "password" ? password : undefined }),
      });
      await refresh();
      toast.success(mode === "signup" ? "Account created" : "Welcome back");
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-14 bg-lavender">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="text-center mb-6">
          <p className="script text-3xl -mb-1">{isLogin ? "Welcome" : "Join"}</p>
          <h1 className="text-3xl font-bold uppercase text-primary">{isLogin ? "Sign in" : "My Cashbook"}</h1>
          <p className="text-sm text-primary/90 mt-1">
            {step === "details"
              ? isLogin
                ? "Track cash in, cash out and balance, together"
                : "Sign up to start managing your cashbook"
              : `Enter the 6-digit code sent to ${email}`}
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-6 shadow-[0_6px_18px_rgba(70,86,140,0.10)]">
          {step === "details" ? (
            <div className="flex flex-col gap-3">
              <div role="tablist" aria-label="Choose how to continue" className="grid grid-cols-2 gap-1 rounded-full bg-surface-2 p-1">
                {([
                  { key: "password", label: "Password", icon: Lock },
                  { key: "otp", label: "Gmail OTP", icon: Mail },
                ] as const).map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={method === key}
                    onClick={() => { setMethod(key); setError(null); }}
                    className={`flex items-center justify-center gap-1.5 rounded-full py-2 text-sm font-semibold transition-colors ${method === key ? "bg-primary text-primary-foreground shadow-sm" : "text-primary hover:bg-lavender"}`}
                  >
                    <Icon size={14} /> {label}
                  </button>
                ))}
              </div>
              {!isLogin && (
                <>
                  <div>
                    <Label htmlFor="name" className="text-primary font-semibold">Full Name</Label>
                    <Input id="name" placeholder="Your name" autoComplete="name" className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="biz" className="text-primary font-semibold">Business Name</Label>
                    <Input id="biz" placeholder="Your business (optional)" autoComplete="organization" className="mt-1.5" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="email" className="text-primary font-semibold">Gmail Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  className="mt-1.5"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canSend && sendCode()}
                  autoFocus
                />
              </div>
              {isLogin && method === "password" && (
                <div>
                  <Label htmlFor="pw" className="text-primary font-semibold">Password</Label>
                  <Input id="pw" type="password" placeholder="••••••••" autoComplete="current-password" className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && passwordLogin()} />
                </div>
              )}
              {!isLogin && method === "password" && (
                <div>
                  <Label htmlFor="pw" className="text-primary font-semibold">Create Password</Label>
                  <Input id="pw" type="password" placeholder="At least 8 characters" autoComplete="new-password" className="mt-1.5" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <p className="text-xs text-muted mt-1">We&apos;ll email a code to confirm your Gmail, then your account is ready.</p>
                </div>
              )}
              <FieldError>{error ?? undefined}</FieldError>
              {isLogin && method === "password" ? (
                <Button onClick={passwordLogin} disabled={loading || !isGmail(email) || !password} className="mt-1 uppercase text-[13px]">
                  {loading ? "Signing in…" : "Sign in"}
                </Button>
              ) : (
                <Button onClick={sendCode} disabled={loading || !canSend} className="mt-1 uppercase text-[13px]">
                  <Mail size={16} /> {loading ? "Sending…" : !isLogin && method === "password" ? "Continue & verify Gmail" : "Send verification OTP"}
                </Button>
              )}
              <p className="text-center text-xs text-muted">
                {method === "password"
                  ? isLogin ? "Sign in instantly with your password." : "Your password is stored securely hashed."
                  : "A 6-digit code is emailed to your Gmail inbox."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Label htmlFor="code" className="text-primary font-semibold">6-digit code</Label>
              <Input
                id="code"
                ref={codeRef}
                inputMode="numeric"
                maxLength={6}
                autoComplete="one-time-code"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                onKeyDown={(e) => e.key === "Enter" && verify()}
                className="text-center text-xl tracking-[0.5em] font-bold"
              />
              <FieldError>{error ?? undefined}</FieldError>
              <Button onClick={verify} disabled={loading || code.length !== 6} className="mt-1 uppercase text-[13px]">
                {loading ? "Verifying…" : isLogin ? "Verify & sign in" : "Verify & create account"}
              </Button>
              <div className="flex items-center justify-between text-xs text-primary mt-1">
                <button onClick={() => { setStep("details"); setCode(""); setError(null); }} className="hover:underline">
                  Use a different email
                </button>
                <button onClick={sendCode} disabled={cooldown > 0 || loading} className="hover:underline disabled:opacity-50 disabled:no-underline">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-sm mt-5">
          {isLogin ? "New here? " : "Already have an account? "}
          <Link href={isLogin ? "/signup" : "/login"} className="font-semibold text-primary hover:underline">
            {isLogin ? "Sign Up" : "Sign In"}
          </Link>
        </p>

        <div className="mt-7 grid grid-cols-3 gap-3 text-center">
          {[
            { icon: ShieldCheck, label: "Verified Gmail" },
            { icon: Lock, label: "Private sessions" },
            { icon: FileText, label: "PDF copies" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5 text-xs text-primary/80">
              <Icon size={16} className="text-primary" />
              {label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
