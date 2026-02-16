import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { SchoolForm } from "@/components/school-form";

export default async function EditSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const school = await prisma.school.findUnique({ where: { id } });

  if (!school) notFound();

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit School</h2>
      <SchoolForm
        school={{
          id: school.id,
          name: school.name,
          regionId: school.regionId,
          type: school.type,
          email: school.email,
          phone: school.phone,
          contactPerson: school.contactPerson,
          status: school.status,
          notes: school.notes,
        }}
      />
    </div>
  );
}
