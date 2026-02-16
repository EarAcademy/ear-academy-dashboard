import { SchoolForm } from "@/components/school-form";

export default function NewSchoolPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Add School</h2>
      <SchoolForm />
    </div>
  );
}
