import { Badge } from "@/components/ui/badge";
import { STATUS_COLORS, type SchoolStatus } from "@/lib/constants";

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status as SchoolStatus] || "bg-gray-100 text-gray-700";
  return (
    <Badge variant="outline" className={colors}>
      {status}
    </Badge>
  );
}
