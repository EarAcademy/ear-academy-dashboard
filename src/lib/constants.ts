export const SCHOOL_STATUSES = [
  "uncontacted",
  "contacted",
  "replied",
  "yes",
  "no",
] as const;

export type SchoolStatus = (typeof SCHOOL_STATUSES)[number];

export const SCHOOL_TYPES = [
  "private",
  "independent",
  "public",
  "international",
] as const;

export const STATUS_COLORS: Record<SchoolStatus, string> = {
  uncontacted: "bg-gray-100 text-gray-700",
  contacted: "bg-blue-100 text-blue-700",
  replied: "bg-yellow-100 text-yellow-700",
  yes: "bg-green-100 text-green-700",
  no: "bg-red-100 text-red-700",
};
