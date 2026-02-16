"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Region {
  id: string;
  name: string;
  totalSchools: number;
  market: { name: string };
  _count: { schools: number };
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegions);
  }, []);

  async function saveTAM(regionId: string) {
    const totalSchools = parseInt(editValue);
    if (isNaN(totalSchools) || totalSchools < 0) {
      toast.error("Must be a non-negative number");
      return;
    }

    try {
      const res = await fetch(`/api/regions/${regionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalSchools }),
      });

      if (res.ok) {
        setRegions((prev) =>
          prev.map((r) => (r.id === regionId ? { ...r, totalSchools } : r))
        );
        setEditingId(null);
        toast.success("TAM updated");
      } else {
        toast.error("Failed to update");
      }
    } catch {
      toast.error("Connection error");
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Regions</h2>
        <p className="text-sm text-muted-foreground">
          Set the total estimated schools (TAM) for each region
        </p>
      </div>

      <div className="bg-white rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Region</TableHead>
              <TableHead>Market</TableHead>
              <TableHead className="text-right">TAM (Total Schools)</TableHead>
              <TableHead className="text-right">Known Schools</TableHead>
              <TableHead className="text-right">Identified %</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {regions.map((region) => (
              <TableRow key={region.id}>
                <TableCell className="font-medium">{region.name}</TableCell>
                <TableCell>{region.market.name}</TableCell>
                <TableCell className="text-right">
                  {editingId === region.id ? (
                    <Input
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => saveTAM(region.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveTAM(region.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      className="w-28 text-right ml-auto"
                      autoFocus
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingId(region.id);
                        setEditValue(String(region.totalSchools));
                      }}
                      className="hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                    >
                      {region.totalSchools.toLocaleString()}
                    </button>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {region._count.schools.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {region.totalSchools > 0
                    ? (
                        (region._count.schools / region.totalSchools) *
                        100
                      ).toFixed(1) + "%"
                    : "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
