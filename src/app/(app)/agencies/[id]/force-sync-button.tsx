"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ForceSyncButton({ agencyId }: { agencyId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    try {
      const res = await fetch(`/api/agencies/${agencyId}/sync`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body.message ?? "Sync failed");
        return;
      }
      toast.success("Force sync started");
      router.refresh();
    } catch {
      toast.error("Network error — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={busy}
      title="Force sync this agency's data with the backend"
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`}
      />
      {busy ? "Syncing…" : "Force sync"}
    </Button>
  );
}
