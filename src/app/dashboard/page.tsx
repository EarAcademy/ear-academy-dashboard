import { prisma } from "@/lib/prisma";
import { TAMSummaryCards } from "@/components/tam-summary-cards";
import {
  TAMDepletionDashboard,
  type ProvinceDepletionData,
} from "@/components/tam-depletion-dashboard";
import { SA_PROVINCE_TAM } from "@/lib/constants";

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
    regionLookup.set(region.name.toLowerCase().trim(), counts);
  }

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
  const depletionData = await getDepletionData();

  // Derive summary card totals from depletion data
  const totalTAM = depletionData.reduce((s, p) => s + p.tam, 0);
  const knownSchools = depletionData.reduce((s, p) => s + p.knownSchools, 0);
  const contactedTotal = depletionData.reduce(
    (s, p) => s + p.contacted + p.replied + p.yes + p.no,
    0
  );
  const repliedTotal = depletionData.reduce(
    (s, p) => s + p.replied + p.yes + p.no,
    0
  );
  const responseRate =
    contactedTotal > 0
      ? ((repliedTotal / contactedTotal) * 100).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      <TAMSummaryCards
        totalTAM={totalTAM}
        knownSchools={knownSchools}
        contacted={contactedTotal}
        responseRate={responseRate}
      />

      <TAMDepletionDashboard provinces={depletionData} />
    </div>
  );
}
