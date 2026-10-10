"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LogOut, Pencil, Check, X } from "lucide-react";
import { useUser } from "@/components/providers/user-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";

export default function ProfilePage() {
  const { user, refresh } = useUser();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const startEditing = () => {
    setName(user?.name ?? "");
    setEditing(true);
  };

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await apiFetch("/api/me", { method: "PATCH", body: JSON.stringify({ name: trimmed }) });
      await refresh();
      toast.success("Name updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update name");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await apiFetch("/api/auth/logout", { method: "POST" });
    toast.success("Signed out");
    router.push("/");
    router.refresh();
  };

  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-primary">Profile</h1>

      <Card>
        <CardContent className="flex items-center gap-4">
          {user.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoUrl} alt="" className="h-16 w-16 rounded-full object-cover shrink-0" />
          ) : (
            <div className="h-16 w-16 rounded-full bg-primary/15 flex items-center justify-center text-2xl font-semibold text-primary shrink-0">
              {user.name[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditing(false);
                  }}
                  autoFocus
                  className="h-9"
                />
                <button
                  onClick={saveName}
                  disabled={saving || !name.trim()}
                  aria-label="Save name"
                  className="p-1.5 rounded-lg hover:bg-surface-2 text-primary shrink-0 disabled:opacity-50"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => setEditing(false)}
                  aria-label="Cancel"
                  className="p-1.5 rounded-lg hover:bg-surface-2 text-muted shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <p className="font-semibold text-lg truncate">{user.name}</p>
                <button
                  onClick={startEditing}
                  aria-label="Edit name"
                  className="p-1 rounded-md hover:bg-surface-2 text-muted shrink-0"
                >
                  <Pencil size={14} />
                </button>
              </div>
            )}
            {user.email && <p className="text-sm text-muted truncate">{user.email}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted">Business</span>
            <span className="text-right">{user.businessName || "—"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">Sign-in</span>
            <span>Gmail one-time code</span>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" onClick={handleLogout} className="self-start">
        <LogOut size={16} /> Sign out
      </Button>
    </div>
  );
}
