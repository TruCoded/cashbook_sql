"use client";

import { useState } from "react";
import { UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api-client";
import { PartnerDrawer } from "./partner-drawer";
import type { CollaboratorInfo, OwnerInfo } from "@/types";

export function CollaboratorsPanel({
  cashbookId,
  owner,
  collaborators,
  isOwner,
  onChange,
  autoPartnerEmail,
}: {
  cashbookId: string;
  owner: OwnerInfo | null;
  collaborators: CollaboratorInfo[];
  isOwner: boolean;
  onChange: () => void;
  autoPartnerEmail?: string;
}) {
  const [addOpen, setAddOpen] = useState(Boolean(autoPartnerEmail));

  const remove = async (userId: string) => {
    if (!confirm("Remove this partner? They will lose access to this cashbook.")) return;
    try {
      await apiFetch(`/api/cashbooks/${cashbookId}/partners/${userId}`, { method: "DELETE" });
      toast.success("Partner removed");
      onChange();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove partner");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold font-serif text-primary">Partners</p>
        {isOwner && (
          <Button variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus size={14} /> Add
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {owner && (
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
              {owner.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{owner.name}</p>
              <p className="text-[11px] text-muted truncate">{owner.email}</p>
            </div>
            <span className="text-xs text-muted">Owner</span>
          </div>
        )}
        {collaborators.map((c) => (
          <div key={c.id} className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-surface-2 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
              {c.name[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm truncate">{c.name}</p>
              <p className="text-[11px] text-muted truncate">{c.email}</p>
            </div>
            <span className="text-xs text-muted">{c.permission === "EDIT" ? "Can edit" : "View only"}</span>
            {isOwner && (
              <button onClick={() => remove(c.userId)} aria-label="Remove partner" className="p-1 rounded-md hover:bg-surface-2 text-muted">
                <UserMinus size={14} />
              </button>
            )}
          </div>
        ))}
        {collaborators.length === 0 && <p className="text-xs text-muted">{isOwner ? "No partner yet. Add one with their Gmail." : "No other partners."}</p>}
      </div>

      {isOwner && <PartnerDrawer cashbookId={cashbookId} open={addOpen} onClose={() => setAddOpen(false)} onAdded={onChange} initialEmail={autoPartnerEmail} />}
    </div>
  );
}
