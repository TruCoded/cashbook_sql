"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Mail, ShieldCheck } from "lucide-react";
import { Drawer } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

const isGmail = (e: string) => /^[a-z0-9._%+-]+@(gmail|googlemail)\.com$/i.test(e.trim());

/**
 * Add a partner in two steps:
 *  1) enter their Gmail -> a 6-digit code is emailed to THEM
 *  2) enter that code -> they become a partner and get a PDF copy of the cashbook by email
 */
export function PartnerDrawer({
  cashbookId,
  open,
  onClose,
  onAdded,
  initialEmail,
}: {
  cashbookId: string;
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  initialEmail?: string;
}) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [permission, setPermission] = useState<"EDIT" | "VIEW">("EDIT");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const autoSent = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const reset = () => {
    setStep("email");
    setCode("");
    setToken("");
    setError(null);
    setEmail("");
    autoSent.current = false;
  };

  const sendCode = async (addr = email) => {
    setError(null);
    if (!isGmail(addr)) return setError("Please use a Gmail address (name@gmail.com)");
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string }>(`/api/cashbooks/${cashbookId}/partners/otp`, {
        method: "POST",
        body: JSON.stringify({ email: addr.trim(), permission }),
      });
      setToken(res.token);
      setStep("code");
      setCooldown(60);
      toast.success(`Code sent to ${addr.trim()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  // Coming from "Create cashbook" with a partner Gmail filled in: send the code straight away.
  useEffect(() => {
    if (open && initialEmail && !autoSent.current) {
      autoSent.current = true;
      setEmail(initialEmail);
      void sendCode(initialEmail);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialEmail]);

  const verify = async () => {
    if (code.length !== 6) return;
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ emailed: number }>(`/api/cashbooks/${cashbookId}/partners/verify`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), code, token, permission }),
      });
      toast.success(res.emailed ? "Partner added — PDF copy emailed to them" : "Partner added (PDF email could not be sent)");
      reset();
      onAdded();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Add a partner"
      description={step === "email" ? "We email a code to their Gmail to confirm it's really them." : `Enter the code sent to ${email}.`}
    >
      {step === "email" ? (
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="partner-email">Partner&apos;s Gmail</Label>
            <Input
              id="partner-email"
              type="email"
              placeholder="partner@gmail.com"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="partner-permission">Permission</Label>
            <select
              id="partner-permission"
              value={permission}
              onChange={(e) => setPermission(e.target.value as "EDIT" | "VIEW")}
              className="mt-1.5 h-11 w-full rounded-xl border border-border bg-surface px-3.5 text-sm"
            >
              <option value="EDIT">Can view and add cash in / out</option>
              <option value="VIEW">View only</option>
            </select>
          </div>
          <FieldError>{error ?? undefined}</FieldError>
          <Button size="lg" onClick={() => sendCode()} disabled={loading || !email.trim()} className="w-full uppercase text-[13px]">
            <Mail size={16} /> {loading ? "Sending…" : "Send OTP to partner"}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-xs text-primary">
            <ShieldCheck size={14} className="shrink-0 mt-0.5" />
            Ask your partner to read you the 6-digit code from their Gmail inbox.
          </div>
          <div>
            <Label htmlFor="partner-code">6-digit code</Label>
            <Input
              id="partner-code"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="123456"
              className="mt-1.5 text-center text-xl tracking-[0.5em] font-bold"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && verify()}
              autoFocus
            />
          </div>
          <FieldError>{error ?? undefined}</FieldError>
          <Button size="lg" onClick={verify} disabled={loading || code.length !== 6} className="w-full uppercase text-[13px]">
            {loading ? "Adding…" : "Verify & add partner"}
          </Button>
          <div className="flex items-center justify-between text-xs text-primary">
            <button onClick={() => { setStep("email"); setCode(""); setError(null); }} className="hover:underline">
              Use a different Gmail
            </button>
            <button onClick={() => sendCode()} disabled={cooldown > 0 || loading} className="hover:underline disabled:opacity-50 disabled:no-underline">
              {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
            </button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
