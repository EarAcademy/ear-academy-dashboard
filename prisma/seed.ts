import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const za = await prisma.market.upsert({
    where: { code: "ZA" },
    update: {},
    create: { name: "South Africa", code: "ZA" },
  });

  const provinces = [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
    "Western Cape",
  ];

  for (const name of provinces) {
    await prisma.region.upsert({
      where: { marketId_name: { marketId: za.id, name } },
      update: {},
      create: { name, marketId: za.id, totalSchools: 0 },
    });
  }

  const pipelines = [
    {
      name: "Sales Qualification",
      acGroupId: 4,
      sortOrder: 1,
      stages: [
        { name: "New Lead", acStageId: 36, sortOrder: 1 },
        { name: "Marketing Qualified Lead", acStageId: 38, sortOrder: 2 },
        { name: "Sales Qualified Lead", acStageId: 39, sortOrder: 3 },
        { name: "Cold Lead", acStageId: 40, sortOrder: 4 },
        { name: "Disqualified", acStageId: 41, sortOrder: 5 },
      ],
    },
    {
      name: "Sales Conversion",
      acGroupId: 5,
      sortOrder: 2,
      stages: [
        { name: "Trial Booked", acStageId: 42, sortOrder: 1 },
        { name: "Trial in Progress", acStageId: 43, sortOrder: 2 },
        { name: "Trial Completed - Review", acStageId: 44, sortOrder: 3 },
        { name: "Proposal", acStageId: 45, sortOrder: 4 },
        { name: "Negotiation", acStageId: 46, sortOrder: 5 },
        { name: "Agreed", acStageId: 47, sortOrder: 6 },
        { name: "Won", acStageId: 48, sortOrder: 7 },
        { name: "Lost", acStageId: 49, sortOrder: 8 },
      ],
    },
    {
      name: "Customer Account Management",
      acGroupId: 6,
      sortOrder: 3,
      stages: [
        { name: "Onboarding", acStageId: 50, sortOrder: 1 },
        { name: "Activated", acStageId: 51, sortOrder: 2 },
        { name: "Upcoming Renewal", acStageId: 52, sortOrder: 3 },
        { name: "Low Activity", acStageId: 53, sortOrder: 4 },
        { name: "Churning", acStageId: 54, sortOrder: 5 },
        { name: "Lost", acStageId: 55, sortOrder: 6 },
      ],
    },
    {
      name: "Cold/Disqualified Leads",
      acGroupId: 7,
      sortOrder: 4,
      stages: [
        { name: "Not Interested", acStageId: 56, sortOrder: 1 },
        { name: "Unable to Contact", acStageId: 57, sortOrder: 2 },
        { name: "Long Term Interest", acStageId: 58, sortOrder: 3 },
        { name: "Disqualified", acStageId: 59, sortOrder: 4 },
      ],
    },
  ];

  for (const p of pipelines) {
    const pipeline = await prisma.pipeline.upsert({
      where: { acGroupId: p.acGroupId },
      update: { name: p.name, sortOrder: p.sortOrder },
      create: { name: p.name, acGroupId: p.acGroupId, sortOrder: p.sortOrder },
    });

    for (const s of p.stages) {
      await prisma.pipelineStage.upsert({
        where: { acStageId: s.acStageId },
        update: { name: s.name, sortOrder: s.sortOrder },
        create: {
          name: s.name,
          acStageId: s.acStageId,
          pipelineId: pipeline.id,
          sortOrder: s.sortOrder,
        },
      });
    }
  }

  console.log("Seed completed: South Africa + 9 provinces + 4 pipelines + 22 stages");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
