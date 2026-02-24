"use client";

import { useState } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const PIPELINE_STAGES = [
  "New Lead",
  "Demo/Pilot",
  "Negotiation",
  "Agreed",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface PipelineSchool {
  id: string;
  name: string;
  province: string;
  currentPipelineStage: string;
  daysInStage: number | null;
  stageEnteredAt: string | null;
  previousStage: string | null;
}

export interface PipelineSummary {
  activePipeline: number;
  customerAccountManagement: number;
  coldDisqualifiedLost: number;
}

export interface PipelineDashboardProps {
  schools: PipelineSchool[];
  summary: PipelineSummary;
  provinces: string[];
}

// Stage visual config
const STAGE_CONFIG: Record<
  string,
  { bg: string; border: string; text: string; badge: string; dot: string }
> = {
  "New Lead": {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-900",
    badge: "bg-blue-100 text-blue-700 border-blue-200",
    dot: "bg-blue-400",
  },
  "Demo/Pilot": {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    text: "text-indigo-900",
    badge: "bg-indigo-100 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-400",
  },
  Negotiation: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-900",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  Agreed: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-900",
    badge: "bg-green-100 text-green-700 border-green-200",
    dot: "bg-green-400",
  },
};

function getDaysColor(days: number | null): string {
  if (days === null) return "text-gray-400";
  if (days > 60) return "text-red-600 font-semibold";
  if (days > 30) return "text-amber-600 font-medium";
  return "text-gray-700";
}

function AgingBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-gray-400 text-xs">—</span>;
  if (days > 60) {
    return (
      <Badge className="text-xs bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
        {days}d — Stale
      </Badge>
    );
  }
  if (days > 30) {
    return (
      <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        {days}d — Aging
      </Badge>
    );
  }
  return (
    <span className={cn("text-sm tabular-nums", getDaysColor(days))}>
      {days}d
    </span>
  );
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

export function PipelineDashboard({
  schools,
  summary,
  provinces,
}: PipelineDashboardProps) {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>("All");

  // Group schools by stage
  const schoolsByStage = PIPELINE_STAGES.reduce<Record<string, PipelineSchool[]>>(
    (acc, stage) => {
      acc[stage] = schools.filter((s) => s.currentPipelineStage === stage);
      return acc;
    },
    {} as Record<string, PipelineSchool[]>
  );

  // Province-filtered schools for selected stage table
  const filteredSchools = (selectedStage ? schoolsByStage[selectedStage] ?? [] : schools).filter(
    (s) => selectedProvince === "All" || s.province === selectedProvince
  );

  // Province breakdown: province → stage → count
  const provinceBreakdown = provinces.reduce<Record<string, Record<string, number>>>(
    (acc, province) => {
      acc[province] = {};
      for (const stage of PIPELINE_STAGES) {
        acc[province][stage] = schools.filter(
          (s) => s.province === province && s.currentPipelineStage === stage
        ).length;
      }
      return acc;
    },
    {}
  );

  // Only show provinces with at least one active school
  const activeProvinces = provinces.filter((p) =>
    PIPELINE_STAGES.some((stage) => (provinceBreakdown[p]?.[stage] ?? 0) > 0)
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Sales Pipeline</p>
                <p className="text-3xl font-bold tabular-nums mt-1">
                  {summary.activePipeline}
                </p>
                <p className="text-xs text-muted-foreground mt-1">deals in funnel</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Customer Account Mgmt</p>
                <p className="text-3xl font-bold tabular-nums mt-1">
                  {summary.customerAccountManagement}
                </p>
                <p className="text-xs text-muted-foreground mt-1">active customers</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cold / Disqualified / Lost</p>
                <p className="text-3xl font-bold tabular-nums mt-1">
                  {summary.coldDisqualifiedLost}
                </p>
                <p className="text-xs text-muted-foreground mt-1">hard NOs</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Province Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">Province:</span>
        {["All", ...provinces].map((province) => (
          <button
            key={province}
            onClick={() => setSelectedProvince(province)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
              selectedProvince === province
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            {province}
          </button>
        ))}
      </div>

      {/* 4-Stage Funnel */}
      <div>
        <h2 className="text-base font-semibold mb-3">Sales Funnel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PIPELINE_STAGES.map((stage, idx) => {
            const config = STAGE_CONFIG[stage];
            const stageSchools = (schoolsByStage[stage] ?? []).filter(
              (s) => selectedProvince === "All" || s.province === selectedProvince
            );
            const days = stageSchools
              .map((s) => s.daysInStage)
              .filter((d): d is number => d !== null);
            const avgDays = avg(days);
            const isSelected = selectedStage === stage;

            return (
              <div key={stage} className="flex items-stretch gap-0">
                <button
                  onClick={() =>
                    setSelectedStage(isSelected ? null : stage)
                  }
                  className={cn(
                    "flex-1 rounded-lg border-2 p-4 text-left transition-all hover:shadow-md",
                    config.bg,
                    isSelected ? "border-gray-900 shadow-md" : config.border
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        config.text
                      )}
                    >
                      {idx + 1}. {stage}
                    </span>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 transition-transform",
                        config.text,
                        isSelected && "rotate-90"
                      )}
                    />
                  </div>

                  <div className={cn("text-4xl font-bold tabular-nums mb-2", config.text)}>
                    {stageSchools.length}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {days.length > 0 ? (
                      <span>avg {avgDays} days</span>
                    ) : (
                      <span>no data</span>
                    )}
                  </div>

                  {/* Mini province breakdown */}
                  {stageSchools.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {Object.entries(
                        stageSchools.reduce<Record<string, number>>((acc, s) => {
                          acc[s.province] = (acc[s.province] ?? 0) + 1;
                          return acc;
                        }, {})
                      )
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([prov, count]) => (
                          <div key={prov} className="flex items-center justify-between">
                            <span className="text-xs text-gray-500 truncate">{prov}</span>
                            <span className="text-xs font-medium tabular-nums text-gray-700 ml-2">
                              {count}
                            </span>
                          </div>
                        ))}
                      {Object.keys(
                        stageSchools.reduce<Record<string, number>>((acc, s) => {
                          acc[s.province] = 1;
                          return acc;
                        }, {})
                      ).length > 3 && (
                        <div className="text-xs text-gray-400">+ more provinces</div>
                      )}
                    </div>
                  )}
                </button>

                {/* Funnel arrow between stages */}
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="hidden lg:flex items-center px-1">
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {selectedStage ? `${selectedStage} — Schools` : "All Active Pipeline Schools"}
              {selectedProvince !== "All" && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  · {selectedProvince}
                </span>
              )}
            </CardTitle>
            <Badge variant="outline" className="tabular-nums">
              {filteredSchools.length} schools
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSchools.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              No schools in this stage
              {selectedProvince !== "All" ? ` for ${selectedProvince}` : ""}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>School</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Days in Stage</TableHead>
                    <TableHead>In Stage Since</TableHead>
                    <TableHead>Previous Stage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools
                    .sort((a, b) => (b.daysInStage ?? 0) - (a.daysInStage ?? 0))
                    .map((school) => {
                      const config = STAGE_CONFIG[school.currentPipelineStage] ?? {};
                      return (
                        <TableRow
                          key={school.id}
                          className={cn(
                            school.daysInStage !== null && school.daysInStage > 60
                              ? "bg-red-50/40"
                              : school.daysInStage !== null && school.daysInStage > 30
                              ? "bg-amber-50/40"
                              : ""
                          )}
                        >
                          <TableCell className="font-medium">{school.name}</TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {school.province}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={cn(
                                "text-xs hover:opacity-100",
                                config.badge ?? "bg-gray-100 text-gray-700 border-gray-200"
                              )}
                            >
                              {school.currentPipelineStage}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <AgingBadge days={school.daysInStage} />
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 tabular-nums">
                            {school.stageEnteredAt
                              ? new Date(school.stageEnteredAt).toLocaleDateString("en-ZA", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">
                            {school.previousStage ?? "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Provincial Breakdown Table */}
      {activeProvinces.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Provincial Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Province</TableHead>
                    {PIPELINE_STAGES.map((stage) => (
                      <TableHead key={stage} className="text-center">
                        <button
                          onClick={() =>
                            setSelectedStage(selectedStage === stage ? null : stage)
                          }
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-medium transition-colors",
                            selectedStage === stage
                              ? "bg-gray-900 text-white"
                              : "hover:bg-gray-100"
                          )}
                        >
                          {stage}
                        </button>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-semibold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeProvinces.map((province) => {
                    const stageCounts = provinceBreakdown[province] ?? {};
                    const total = PIPELINE_STAGES.reduce(
                      (s, stage) => s + (stageCounts[stage] ?? 0),
                      0
                    );
                    return (
                      <TableRow
                        key={province}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selectedProvince === province
                            ? "bg-gray-100"
                            : "hover:bg-gray-50"
                        )}
                        onClick={() =>
                          setSelectedProvince(
                            selectedProvince === province ? "All" : province
                          )
                        }
                      >
                        <TableCell className="font-medium">{province}</TableCell>
                        {PIPELINE_STAGES.map((stage) => {
                          const count = stageCounts[stage] ?? 0;
                          const config = STAGE_CONFIG[stage];
                          return (
                            <TableCell key={stage} className="text-center tabular-nums">
                              {count > 0 ? (
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold",
                                    config.bg,
                                    config.text
                                  )}
                                >
                                  {count}
                                </span>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center tabular-nums font-semibold">
                          {total}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Totals row */}
                  <TableRow className="border-t-2 bg-gray-50 font-semibold">
                    <TableCell>Total</TableCell>
                    {PIPELINE_STAGES.map((stage) => {
                      const total = activeProvinces.reduce(
                        (s, p) => s + (provinceBreakdown[p]?.[stage] ?? 0),
                        0
                      );
                      return (
                        <TableCell key={stage} className="text-center tabular-nums">
                          {total}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center tabular-nums">
                      {schools.length}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
