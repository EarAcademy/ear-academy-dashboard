"use client";

import { AlertTriangle, XCircle, TrendingDown, Gauge } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { DEPLETION_THRESHOLDS } from "@/lib/constants";

export interface ProvinceDepletionData {
  name: string;
  tam: number;
  knownSchools: number;
  contacted: number;
  replied: number;
  yes: number;
  no: number;
  uncontacted: number;
}

interface ProvinceMetrics extends ProvinceDepletionData {
  totalTouched: number;
  contactedPct: number;
  hardNoRate: number;
  runway: number;
  conversionRate: number;
  target: number;
  stillNeed: number;
  convertiblePool: number;
  netConvertible: number;
  isWarn: boolean;
  isCritical: boolean;
}

function calcMetrics(d: ProvinceDepletionData): ProvinceMetrics {
  const totalTouched = d.contacted + d.replied + d.yes + d.no;
  const contactedPct = d.tam > 0 ? (totalTouched / d.tam) * 100 : 0;
  const hardNoRate = totalTouched > 0 ? (d.no / totalTouched) * 100 : 0;
  const runway = Math.max(0, d.tam - totalTouched);
  const definitive = d.yes + d.no;
  const conversionRate = definitive > 0 ? (d.yes / definitive) * 100 : 0;

  // Target = 20% of TAM (rounded up)
  const target = Math.ceil(d.tam * 0.2);
  // Still Need = how many more wins required to hit target (floor at 0)
  const stillNeed = Math.max(0, target - d.yes);
  // Convertible Pool = all schools that haven't hard-rejected us
  const convertiblePool = d.tam - d.no;
  // Net = pool minus expected future NOs from remaining runway (based on current NO rate)
  const netConvertible = Math.max(
    0,
    convertiblePool - Math.round(runway * (hardNoRate / 100))
  );

  return {
    ...d,
    totalTouched,
    contactedPct,
    hardNoRate,
    runway,
    conversionRate,
    target,
    stillNeed,
    convertiblePool,
    netConvertible,
    isWarn: contactedPct >= DEPLETION_THRESHOLDS.CONTACTED_WARN,
    isCritical: hardNoRate >= DEPLETION_THRESHOLDS.HARD_NO_CRITICAL,
  };
}

function StatusBadge({ m }: { m: ProvinceMetrics }) {
  if (m.isCritical) {
    return (
      <Badge className="text-xs bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
        Critical
      </Badge>
    );
  }
  if (m.isWarn) {
    return (
      <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
        Warning
      </Badge>
    );
  }
  if (m.contactedPct > 40) {
    return (
      <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-100">
        Monitor
      </Badge>
    );
  }
  return (
    <Badge className="text-xs bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
      Healthy
    </Badge>
  );
}

export function TAMDepletionDashboard({
  provinces,
}: {
  provinces: ProvinceDepletionData[];
}) {
  const metrics: ProvinceMetrics[] = provinces
    .map(calcMetrics)
    .sort((a, b) => b.contactedPct - a.contactedPct);

  const warnProvinces = metrics.filter((m) => m.isWarn && !m.isCritical);
  const criticalProvinces = metrics.filter((m) => m.isCritical);

  const totalTAM = metrics.reduce((s, m) => s + m.tam, 0);
  const totalTouched = metrics.reduce((s, m) => s + m.totalTouched, 0);
  const totalRunway = metrics.reduce((s, m) => s + m.runway, 0);
  const totalYes = metrics.reduce((s, m) => s + m.yes, 0);
  const totalNo = metrics.reduce((s, m) => s + m.no, 0);
  const totalTarget = metrics.reduce((s, m) => s + m.target, 0);
  const totalStillNeed = metrics.reduce((s, m) => s + m.stillNeed, 0);
  const totalConvertiblePool = metrics.reduce((s, m) => s + m.convertiblePool, 0);
  const totalNetConvertible = metrics.reduce((s, m) => s + m.netConvertible, 0);
  const overallTamPct = totalTAM > 0 ? (totalTouched / totalTAM) * 100 : 0;
  const overallNoRate =
    totalTouched > 0 ? (totalNo / totalTouched) * 100 : 0;
  const overallConversion =
    totalYes + totalNo > 0
      ? ((totalYes / (totalYes + totalNo)) * 100).toFixed(1)
      : "—";

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">TAM Depletion Monitor</h2>
          <p className="text-muted-foreground text-sm">
            Market exhaustion risk across South African provinces ·{" "}
            <span className="font-medium text-foreground">
              {totalTAM.toLocaleString()}
            </span>{" "}
            total independent schools
          </p>
        </div>
      </div>

      {/* Alert banners */}
      {criticalProvinces.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
          <XCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 text-sm">
              Critical: Hard NO rate ≥ 60%
            </p>
            <p className="text-sm text-red-700">
              {criticalProvinces.map((p) => p.name).join(", ")} —{" "}
              rejection rate is critically high. Review messaging and targeting.
            </p>
          </div>
        </div>
      )}

      {warnProvinces.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              Warning: TAM approaching exhaustion (≥ 80% contacted)
            </p>
            <p className="text-sm text-amber-700">
              {warnProvinces.map((p) => p.name).join(", ")} —{" "}
              limited fresh leads remaining. Prioritise these provinces.
            </p>
          </div>
        </div>
      )}

      {criticalProvinces.length === 0 && warnProvinces.length === 0 && (
        <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-lg p-4">
          <Gauge className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-green-800 text-sm">
              All provinces healthy
            </p>
            <p className="text-sm text-green-700">
              No provinces have hit warning or critical thresholds yet.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining Runway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRunway.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {totalTAM > 0
                ? ((totalRunway / totalTAM) * 100).toFixed(1)
                : "0"}
              % of TAM untouched
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              TAM Penetration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {overallTamPct.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {totalTouched.toLocaleString()} of{" "}
              {totalTAM.toLocaleString()} touched
            </p>
            <Progress
              value={overallTamPct}
              className={cn(
                "h-1.5 mt-2",
                overallTamPct >= DEPLETION_THRESHOLDS.CONTACTED_WARN
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-blue-500"
              )}
            />
          </CardContent>
        </Card>

        <Card
          className={cn(
            warnProvinces.length + criticalProvinces.length > 0
              ? "border-amber-200"
              : ""
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Provinces at Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {warnProvinces.length + criticalProvinces.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalProvinces.length} critical · {warnProvinces.length}{" "}
              warning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5" />
              Overall Hard NO Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={cn(
                "text-2xl font-bold",
                overallNoRate >= DEPLETION_THRESHOLDS.HARD_NO_CRITICAL
                  ? "text-red-600"
                  : overallNoRate >= 40
                  ? "text-amber-600"
                  : ""
              )}
            >
              {overallNoRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Conv. rate: {overallConversion}
              {overallConversion !== "—" ? "%" : ""} (yes/{" "}
              {(totalYes + totalNo).toLocaleString()} decided)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Province breakdown table */}
      <div className="bg-white rounded-lg border">
        <div className="px-4 py-3 border-b bg-gray-50/50 rounded-t-lg">
          <p className="text-sm font-medium text-muted-foreground">
            Province breakdown — sorted by % TAM contacted (most depleted first)
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Province</TableHead>
              <TableHead className="text-right">TAM</TableHead>
              <TableHead className="text-right">
                Target
                <div className="text-xs font-normal text-muted-foreground">20% of TAM</div>
              </TableHead>
              <TableHead className="text-right">Won</TableHead>
              <TableHead className="text-right">
                Still Need
                <div className="text-xs font-normal text-muted-foreground">Target − Won</div>
              </TableHead>
              <TableHead className="text-right">In DB</TableHead>
              <TableHead className="text-right">Touched</TableHead>
              <TableHead className="w-44">
                % Contacted{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (warn ≥80%)
                </span>
              </TableHead>
              <TableHead className="text-right">Hard NOs</TableHead>
              <TableHead className="text-right">
                NO Rate{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (crit ≥60%)
                </span>
              </TableHead>
              <TableHead className="text-right">
                Conv. Pool
                <div className="text-xs font-normal text-muted-foreground">TAM − NOs</div>
              </TableHead>
              <TableHead className="text-right">Runway</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metrics.map((m) => (
              <TableRow
                key={m.name}
                className={cn(
                  m.isCritical
                    ? "bg-red-50/40"
                    : m.isWarn
                    ? "bg-amber-50/40"
                    : ""
                )}
              >
                <TableCell className="font-medium">{m.name}</TableCell>

                {/* TAM */}
                <TableCell className="text-right text-muted-foreground">
                  {m.tam.toLocaleString()}
                </TableCell>

                {/* Target: 20% of TAM */}
                <TableCell className="text-right text-muted-foreground">
                  {m.target.toLocaleString()}
                </TableCell>

                {/* Won */}
                <TableCell className="text-right font-medium text-green-600">
                  {m.yes.toLocaleString()}
                </TableCell>

                {/* Still Need */}
                <TableCell
                  className={cn(
                    "text-right font-medium",
                    m.stillNeed === 0
                      ? "text-green-600"
                      : m.stillNeed > m.netConvertible
                      ? "text-red-600"
                      : "text-foreground"
                  )}
                >
                  {m.stillNeed.toLocaleString()}
                </TableCell>

                {/* In DB */}
                <TableCell className="text-right text-muted-foreground">
                  {m.knownSchools.toLocaleString()}
                </TableCell>

                {/* Touched */}
                <TableCell className="text-right font-medium">
                  {m.totalTouched.toLocaleString()}
                </TableCell>

                {/* % Contacted progress bar */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={Math.min(100, m.contactedPct)}
                      className={cn(
                        "h-2 flex-1",
                        m.isWarn
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-blue-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs w-12 text-right font-medium tabular-nums",
                        m.isWarn ? "text-amber-700" : "text-muted-foreground"
                      )}
                    >
                      {m.contactedPct.toFixed(1)}%
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-right">{m.no}</TableCell>

                {/* Hard NO Rate */}
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-medium tabular-nums",
                      m.isCritical
                        ? "text-red-600"
                        : m.hardNoRate >= 40
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {m.totalTouched > 0 ? `${m.hardNoRate.toFixed(1)}%` : "—"}
                  </span>
                </TableCell>

                {/* Convertible Pool */}
                <TableCell className="text-right">
                  <div className="font-medium tabular-nums">
                    {m.convertiblePool.toLocaleString()}
                  </div>
                  <div
                    className={cn(
                      "text-xs tabular-nums",
                      m.netConvertible < m.stillNeed
                        ? "text-red-600 font-medium"
                        : "text-muted-foreground"
                    )}
                  >
                    Net: {m.netConvertible.toLocaleString()}
                  </div>
                </TableCell>

                {/* Runway */}
                <TableCell
                  className={cn(
                    "text-right font-semibold tabular-nums",
                    m.runway === 0
                      ? "text-red-600"
                      : m.runway < 30
                      ? "text-amber-600"
                      : "text-foreground"
                  )}
                >
                  {m.runway.toLocaleString()}
                </TableCell>

                <TableCell>
                  <StatusBadge m={m} />
                </TableCell>
              </TableRow>
            ))}

            {/* Totals row */}
            <TableRow className="bg-gray-50 font-semibold border-t-2">
              <TableCell>Total</TableCell>
              <TableCell className="text-right">
                {totalTAM.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {totalTarget.toLocaleString()}
              </TableCell>
              <TableCell className="text-right text-green-600">
                {totalYes.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {totalStillNeed.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {metrics.reduce((s, m) => s + m.knownSchools, 0).toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                {totalTouched.toLocaleString()}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress
                    value={Math.min(100, overallTamPct)}
                    className={cn(
                      "h-2 flex-1",
                      overallTamPct >= DEPLETION_THRESHOLDS.CONTACTED_WARN
                        ? "[&>div]:bg-amber-500"
                        : "[&>div]:bg-blue-500"
                    )}
                  />
                  <span className="text-xs w-12 text-right tabular-nums">
                    {overallTamPct.toFixed(1)}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">{totalNo}</TableCell>
              <TableCell className="text-right tabular-nums">
                {overallNoRate.toFixed(1)}%
              </TableCell>
              <TableCell className="text-right">
                <div>{totalConvertiblePool.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground font-normal">
                  Net: {totalNetConvertible.toLocaleString()}
                </div>
              </TableCell>
              <TableCell className="text-right">
                {totalRunway.toLocaleString()}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
