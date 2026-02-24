import { prisma } from "@/lib/prisma";
import { SA_PROVINCE_TAM } from "@/lib/constants";
import {
  PipelineDashboard,
  type PipelineSchool,
  type PipelineSummary,
} from "@/components/pipeline-dashboard";

async function getPipelineData() {
  // All schools with region + market for province lookup
  const schools = await prisma.school.findMany({
    include: {
      region: true,
    },
  });

  const now = Date.now();

  // Schools actively in the sales funnel
  const activePipelineSchools: PipelineSchool[] = schools
    .filter((s) => s.currentPipelineStage !== null)
    .map((s) => {
      const daysInStage =
        s.stageEnteredAt
          ? Math.floor((now - s.stageEnteredAt.getTime()) / (1000 * 60 * 60 * 24))
          : null;
      return {
        id: s.id,
        name: s.name,
        province: s.region.name,
        currentPipelineStage: s.currentPipelineStage!,
        daysInStage,
        stageEnteredAt: s.stageEnteredAt?.toISOString() ?? null,
        previousStage: s.previousStage ?? null,
      };
    });

  const summary: PipelineSummary = {
    activePipeline: activePipelineSchools.length,
    customerAccountManagement: schools.filter((s) => s.status === "yes").length,
    coldDisqualifiedLost: schools.filter((s) => s.status === "no").length,
  };

  // Provinces that appear in the TAM, in canonical order
  const provinces = Object.keys(SA_PROVINCE_TAM);

  return { schools: activePipelineSchools, summary, provinces };
}

export default async function PipelinePage() {
  const { schools, summary, provinces } = await getPipelineData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Pipeline Visualization</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Active sales funnel · {summary.activePipeline} deals tracked
        </p>
      </div>

      <PipelineDashboard schools={schools} summary={summary} provinces={provinces} />
    </div>
  );
}
