"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

interface RegionData {
  id: string;
  name: string;
  marketName: string;
  totalSchools: number;
  knownSchools: number;
  uncontacted: number;
  contacted: number;
  replied: number;
  yes: number;
  no: number;
}

function pct(num: number, denom: number): string {
  if (denom === 0) return "0";
  return ((num / denom) * 100).toFixed(1);
}

export function TAMOverviewTable({ data }: { data: RegionData[] }) {
  const totals = data.reduce(
    (acc, r) => ({
      totalSchools: acc.totalSchools + r.totalSchools,
      knownSchools: acc.knownSchools + r.knownSchools,
      contacted: acc.contacted + r.contacted,
      replied: acc.replied + r.replied,
      yes: acc.yes + r.yes,
      no: acc.no + r.no,
      uncontacted: acc.uncontacted + r.uncontacted,
    }),
    { totalSchools: 0, knownSchools: 0, contacted: 0, replied: 0, yes: 0, no: 0, uncontacted: 0 }
  );

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Region</TableHead>
            <TableHead className="text-right">TAM</TableHead>
            <TableHead className="text-right">Known</TableHead>
            <TableHead className="w-32">Identified</TableHead>
            <TableHead className="text-right">Contacted</TableHead>
            <TableHead className="text-right">Replied</TableHead>
            <TableHead className="text-right">Yes</TableHead>
            <TableHead className="text-right">No</TableHead>
            <TableHead className="text-right">Uncontacted</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((region) => {
            const identifiedPct = region.totalSchools > 0
              ? (region.knownSchools / region.totalSchools) * 100
              : 0;
            return (
              <TableRow key={region.id}>
                <TableCell className="font-medium">
                  <div>{region.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {region.marketName}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {region.totalSchools.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {region.knownSchools.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={identifiedPct} className="h-2" />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {pct(region.knownSchools, region.totalSchools)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {region.contacted}
                </TableCell>
                <TableCell className="text-right">
                  {region.replied}
                </TableCell>
                <TableCell className="text-right text-green-600 font-medium">
                  {region.yes}
                </TableCell>
                <TableCell className="text-right text-red-600">
                  {region.no}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {region.uncontacted}
                </TableCell>
              </TableRow>
            );
          })}
          {/* Totals row */}
          <TableRow className="bg-gray-50 font-semibold">
            <TableCell>Total</TableCell>
            <TableCell className="text-right">
              {totals.totalSchools.toLocaleString()}
            </TableCell>
            <TableCell className="text-right">
              {totals.knownSchools.toLocaleString()}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress
                  value={
                    totals.totalSchools > 0
                      ? (totals.knownSchools / totals.totalSchools) * 100
                      : 0
                  }
                  className="h-2"
                />
                <span className="text-xs w-12 text-right">
                  {pct(totals.knownSchools, totals.totalSchools)}%
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right">{totals.contacted}</TableCell>
            <TableCell className="text-right">{totals.replied}</TableCell>
            <TableCell className="text-right text-green-600">
              {totals.yes}
            </TableCell>
            <TableCell className="text-right text-red-600">
              {totals.no}
            </TableCell>
            <TableCell className="text-right">{totals.uncontacted}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
