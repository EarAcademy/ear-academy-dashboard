"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import Papa from "papaparse";

interface PreviewRow {
  name: string;
  region: string;
  type?: string;
  email?: string;
}

export default function CSVUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const csv = ev.target?.result as string;
      const parsed = Papa.parse<Record<string, string>>(csv, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      });

      setTotalRows(parsed.data.length);
      setPreview(
        parsed.data.slice(0, 10).map((row) => ({
          name: row.name || "",
          region: row.region || "",
          type: row.type || "",
          email: row.email || "",
        }))
      );
    };
    reader.readAsText(f);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/schools/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setResult(data);
        toast.success(`Created ${data.created} schools, skipped ${data.skipped}`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">CSV Upload</h2>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file to bulk-import schools
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Expected CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-xs bg-gray-100 p-2 rounded block">
            name,region,type,email,phone,contact_person
          </code>
          <p className="text-sm text-muted-foreground mt-2">
            Required columns: <strong>name</strong>, <strong>region</strong>.
            Region must match an existing region name (e.g., &quot;Gauteng&quot;, &quot;Western Cape&quot;).
          </p>
        </CardContent>
      </Card>

      <Card className="max-w-4xl">
        <CardHeader>
          <CardTitle className="text-base">Upload File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
          />

          {preview.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                Preview: showing first 10 of {totalRows} rows
              </p>
              <div className="border rounded-lg overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Region</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.name}</TableCell>
                        <TableCell>{row.region}</TableCell>
                        <TableCell>{row.type || "-"}</TableCell>
                        <TableCell>{row.email || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? "Uploading..." : `Upload ${totalRows} Schools`}
              </Button>
            </>
          )}

          {result && (
            <div className="space-y-2 mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="font-medium">Upload Results:</p>
              <p className="text-sm">Created: {result.created}</p>
              <p className="text-sm">Skipped: {result.skipped}</p>
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
