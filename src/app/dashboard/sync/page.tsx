"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SyncStatus {
  lastSync: {
    id: string;
    syncType: string;
    status: string;
    contactsSynced: number;
    errors: string | null;
    startedAt: string;
    completedAt: string | null;
  } | null;
  linkedSchools: number;
}

export default function SyncPage() {
  const [data, setData] = useState<SyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function fetchStatus() {
    const res = await fetch("/api/activecampaign/status");
    const status = await res.json();
    setData(status);
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleSync() {
    setSyncing(true);
    toast.info("Sync started — this may take a moment...");

    try {
      const res = await fetch("/api/activecampaign/sync", { method: "POST" });
      const result = await res.json();

      if (res.ok) {
        toast.success(`Sync complete: ${result.contactsSynced} contacts synced`);
        fetchStatus();
      } else {
        toast.error(result.error || "Sync failed");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">ActiveCampaign Sync</h2>
        <p className="text-sm text-muted-foreground">
          Sync contact and deal data from ActiveCampaign
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Linked Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.linkedSchools ?? "..."}
            </div>
            <p className="text-xs text-muted-foreground">
              schools matched to AC contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Sync
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.lastSync ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      data.lastSync.status === "completed"
                        ? "default"
                        : data.lastSync.status === "running"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {data.lastSync.status}
                  </Badge>
                </div>
                <p className="text-sm">
                  {data.lastSync.contactsSynced} contacts synced
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(data.lastSync.startedAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No sync yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Button onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing..." : "Sync Now"}
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Syncs all AC contacts and matches them to existing school records by
          email. Also updates pipeline stages from AC deals.
        </p>
      </div>

      {data?.lastSync?.errors && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm">Sync Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-48">
              {JSON.parse(data.lastSync.errors).join("\n")}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
