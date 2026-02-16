"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SCHOOL_STATUSES, SCHOOL_TYPES } from "@/lib/constants";
import { toast } from "sonner";

interface SchoolData {
  id?: string;
  name: string;
  regionId: string;
  type: string | null;
  email: string | null;
  phone: string | null;
  contactPerson: string | null;
  status: string;
  notes: string | null;
}

interface Region {
  id: string;
  name: string;
  market: { name: string };
}

export function SchoolForm({ school }: { school?: SchoolData }) {
  const router = useRouter();
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: school?.name || "",
    regionId: school?.regionId || "",
    type: school?.type || "",
    email: school?.email || "",
    phone: school?.phone || "",
    contactPerson: school?.contactPerson || "",
    status: school?.status || "uncontacted",
    notes: school?.notes || "",
  });

  const isEdit = !!school?.id;

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegions);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit ? `/api/schools/${school.id}` : "/api/schools";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          type: form.type || null,
          email: form.email || null,
          phone: form.phone || null,
          contactPerson: form.contactPerson || null,
          notes: form.notes || null,
        }),
      });

      if (res.ok) {
        toast.success(isEdit ? "School updated" : "School created");
        router.push("/dashboard/schools");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to save");
      }
    } catch {
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!isEdit || !confirm("Delete this school?")) return;
    try {
      const res = await fetch(`/api/schools/${school.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("School deleted");
        router.push("/dashboard/schools");
        router.refresh();
      }
    } catch {
      toast.error("Failed to delete");
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEdit ? "Edit School" : "Add School"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">School Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="region">Region *</Label>
              <Select
                value={form.regionId}
                onValueChange={(v) => setForm({ ...form, regionId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.market.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type">Type</Label>
              <Select
                value={form.type}
                onValueChange={(v) =>
                  setForm({ ...form, type: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {SCHOOL_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="contact">Contact Person</Label>
              <Input
                id="contact"
                value={form.contactPerson}
                onChange={(e) =>
                  setForm({ ...form, contactPerson: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHOOL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update" : "Create"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            {isEdit && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                className="ml-auto"
              >
                Delete
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
