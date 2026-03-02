"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface PreviewRow {
  name: string;
  email: string;
}

interface Region {
  id: string;
  name: string;
}

export default function ImportISASAPage() {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegionId, setSelectedRegionId] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegions);
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const csv = ev.target?.result as string;
      const parsed = Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
      });

      const rows: PreviewRow[] = parsed.data
        .map((row) => ({
          name: (
            row["School Name"] ||
            row["school name"] ||
            row["school_name"] ||
            ""
          ).trim(),
          email: (
            row["Email Address"] ||
            row["email address"] ||
            row["email_address"] ||
            row["Email"] ||
            row["email"] ||
            ""
          ).trim(),
        }))
        .filter((row) => row.name);

      setPreview(rows);
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!selectedRegionId || preview.length === 0) return;
    setImporting(true);

    try {
      const res = await fetch("/api/schools/import-isasa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: preview, regionId: selectedRegionId }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(`Imported ${data.created} schools`);
      } else {
        toast.error(data.error || "Import failed");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">ISASA Import</h2>
        <p className="text-sm text-muted-foreground">
          Import schools from an ISASA CSV export
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Expected CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-xs bg-gray-100 p-2 rounded block">
            School Name,Email Address
          </code>
          <p className="text-sm text-muted-foreground mt-2">
            Required column: <strong>School Name</strong>. Email Address is
            optional — rows with blank emails are still imported.
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Import Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Region</Label>
            <Select value={selectedRegionId} onValueChange={setSelectedRegionId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a province..." />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>CSV File</Label>
            <Input type="file" accept=".csv" onChange={handleFileSelect} />
          </div>

          {preview.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {preview.length} school{preview.length !== 1 ? "s" : ""} found
                in file
              </p>
              <div className="border rounded-lg overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>School Name</TableHead>
                      <TableHead>Email Address</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground text-xs">
                          {i + 1}
                        </TableCell>
                        <TableCell>{row.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.email || (
                            <span className="italic text-muted-foreground/60">
                              no email
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleImport}
                  disabled={importing || !selectedRegionId}
                >
                  {importing
                    ? "Importing..."
                    : `Import ${preview.length} Schools`}
                </Button>
                {!selectedRegionId && (
                  <p className="text-sm text-amber-600">
                    Select a province before importing.
                  </p>
                )}
              </div>
            </>
          )}

          {result && (
            <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Import Results</p>
              <p className="text-sm">Created: {result.created}</p>
              <p className="text-sm">
                Skipped (duplicates): {result.skipped}
              </p>
              {result.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-600">
                    Errors ({result.errors.length}):
                  </p>
                  <ul className="text-xs text-red-600 list-disc pl-4 max-h-40 overflow-auto">
                    {result.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard/schools")}
              >
                View Schools
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
