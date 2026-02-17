import { prisma } from "@/lib/prisma";
import { TAMSummaryCards } from "@/components/tam-summary-cards";
import { TAMOverviewTable } from "@/components/tam-overview-table";
import {
  TAMDepletionDashboard,
  type ProvinceDepletionData,
} from "@/components/tam-depletion-dashboard";
import { SA_PROVINCE_TAM } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";

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

async function getTAMData(): Promise<RegionData[]> {
  const regions = await prisma.region.findMany({
    include: {
      market: true,
      schools: {
        select: { status: true },
      },
    },
    orderBy: [{ market: { name: "asc" } }, { name: "asc" }],
  });

  return regions.map((region) => {
    const statusCounts = { uncontacted: 0, contacted: 0, replied: 0, yes: 0, no: 0 };
    for (const school of region.schools) {
      const s = school.status as keyof typeof statusCounts;
      if (s in statusCounts) statusCounts[s]++;
    }

    return {
      id: region.id,
      name: region.name,
      marketName: region.market.name,
      totalSchools: region.totalSchools,
      knownSchools: region.schools.length,
      ...statusCounts,
    };
  });
}

async function getDepletionData(): Promise<ProvinceDepletionData[]> {
  const regions = await prisma.region.findMany({
    include: {
      schools: {
        select: { status: true },
      },
    },
  });

  // Build a lookup: normalised region name → status counts
  const regionLookup = new Map<
    string,
    { total: number; contacted: number; replied: number; yes: number; no: number; uncontacted: number }
  >();

  for (const region of regions) {
    const counts = { total: 0, contacted: 0, replied: 0, yes: 0, no: 0, uncontacted: 0 };
    for (const school of region.schools) {
      counts.total++;
      const s = school.status as keyof Omit<typeof counts, "total">;
      if (s in counts) counts[s]++;
    }
    // Normalise to lowercase for case-insensitive matching
    regionLookup.set(region.name.toLowerCase().trim(), counts);
  }

  // Map each canonical SA province against DB data
  return Object.entries(SA_PROVINCE_TAM).map(([name, tam]) => {
    const counts = regionLookup.get(name.toLowerCase().trim());
    return {
      name,
      tam,
      knownSchools: counts?.total ?? 0,
      contacted: counts?.contacted ?? 0,
      replied: counts?.replied ?? 0,
      yes: counts?.yes ?? 0,
      no: counts?.no ?? 0,
      uncontacted: counts?.uncontacted ?? 0,
    };
  });
}

export default async function DashboardPage() {
  const [data, depletionData] = await Promise.all([
    getTAMData(),
    getDepletionData(),
  ]);

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

  const contactedTotal = totals.contacted + totals.replied + totals.yes + totals.no;
  const responseRate =
    contactedTotal > 0
      ? (((totals.replied + totals.yes + totals.no) / contactedTotal) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-10">
      {/* ── TAM Overview ── */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">TAM Overview</h2>
          <p className="text-muted-foreground text-sm">
            Total Addressable Market penetration by region
          </p>
        </div>

        <TAMSummaryCards
          totalTAM={totals.totalSchools}
          knownSchools={totals.knownSchools}
          contacted={contactedTotal}
          responseRate={responseRate}
        />

        <TAMOverviewTable data={data} />
      </div>

      <Separator />

      {/* ── TAM Depletion Monitor ── */}
      <TAMDepletionDashboard provinces={depletionData} />
    </div>
  );
}
