"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { SCHOOL_STATUSES } from "@/lib/constants";
import { Plus, Upload } from "lucide-react";

interface School {
  id: string;
  name: string;
  type: string | null;
  email: string | null;
  status: string;
  region: {
    name: string;
    market: { name: string };
  };
}

interface Region {
  id: string;
  name: string;
  market: { name: string };
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (search) params.set("search", search);
    if (regionFilter) params.set("regionId", regionFilter);
    if (statusFilter) params.set("status", statusFilter);

    const res = await fetch(`/api/schools?${params}`);
    const data = await res.json();
    setSchools(data.schools);
    setTotal(data.pagination.total);
    setLoading(false);
  }, [page, search, regionFilter, statusFilter]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegions);
  }, []);

  const totalPages = Math.ceil(total / 50);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Schools</h2>
          <p className="text-sm text-muted-foreground">
            {total} school{total !== 1 ? "s" : ""} in database
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/dashboard/schools/upload">
              <Upload className="h-4 w-4 mr-1" />
              CSV Upload
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/schools/new">
              <Plus className="h-4 w-4 mr-1" />
              Add School
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={regionFilter}
          onValueChange={(v) => {
            setRegionFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {SCHOOL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : schools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No schools found
                </TableCell>
              </TableRow>
            ) : (
              schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>
                    <div>{school.region.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {school.region.market.name}
                    </div>
                  </TableCell>
                  <TableCell>{school.type || "-"}</TableCell>
                  <TableCell className="text-sm">{school.email || "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={school.status} />
                  </TableCell>
                  <TableCell>
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/dashboard/schools/${school.id}`}>Edit</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
