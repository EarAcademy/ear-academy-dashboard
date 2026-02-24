"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, WifiOff } from "lucide-react";
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

function parseErrors(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(String);
    return [String(parsed)];
  } catch {
    return [raw];
  }
}

export default function SyncPage() {
  const [data, setData] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [acWarning, setAcWarning] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  async function fetchStatus() {
    setLoading(true);
    setHistoryError(false);
    try {
      const res = await fetch("/api/activecampaign/status");
      if (!res.ok) throw new Error(`Status ${res.status}`);
      let json: SyncStatus;
      try {
        json = await res.json();
      } catch {
        throw new Error("Invalid response from server");
      }
      setData(json);
    } catch (err) {
      console.error("[SyncPage] fetchStatus failed:", err);
      setHistoryError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  async function handleSync() {
    setSyncing(true);
    setAcWarning(null);
    toast.info("Sync started — this may take a moment...");

    try {
      const res = await fetch("/api/activecampaign/sync", { method: "POST" });

      // Safely parse response — it might not be JSON on a hard crash
      let result: Record<string, unknown> = {};
      try {
        result = await res.json();
      } catch {
        throw new Error(`Sync returned a non-JSON response (HTTP ${res.status})`);
      }

      if (res.ok) {
        const errorCount = (result.errorCount as number) ?? 0;
        toast.success(
          `Sync complete: ${result.contactsSynced} contacts synced${errorCount > 0 ? ` (${errorCount} errors — see below)` : ""}`
        );
        fetchStatus();
      } else {
        const msg = (result.details as string) || (result.error as string) || "Sync failed";
        // Surface AC-specific errors as a page warning rather than just a toast
        if (msg.toLowerCase().includes("ac api") || msg.includes("590")) {
          setAcWarning(msg);
        }
        toast.error(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Connection error";
      if (msg.toLowerCase().includes("ac api") || msg.includes("590")) {
        setAcWarning(msg);
      }
      toast.error(msg);
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

      {/* AC connection warning */}
      {acWarning && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 max-w-2xl">
          <WifiOff className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800">AC connection issue</p>
            <p className="text-xs text-amber-700 mt-0.5 break-all">{acWarning}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Linked Schools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "..." : historyError ? "—" : (data?.linkedSchools ?? 0)}
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
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : historyError ? (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p className="text-sm">Unable to load sync history</p>
              </div>
            ) : data?.lastSync ? (
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

      {/* Sync errors from last run */}
      {!historyError && data?.lastSync?.errors && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Sync Errors ({parseErrors(data.lastSync.errors).length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-48 whitespace-pre-wrap break-all">
              {parseErrors(data.lastSync.errors).join("\n")}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
