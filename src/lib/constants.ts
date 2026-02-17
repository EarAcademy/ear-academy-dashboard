// South African independent school TAM by province (source: ISASA / Dept of Basic Education data)
export const SA_PROVINCE_TAM: Record<string, number> = {
  "Gauteng": 937,
  "Western Cape": 331,
  "Eastern Cape": 305,
  "KwaZulu-Natal": 277,
  "Limpopo": 233,
  "Mpumalanga": 137,
  "North West": 121,
  "Free State": 83,
  "Northern Cape": 46,
};

export const DEPLETION_THRESHOLDS = {
  CONTACTED_WARN: 80,   // % of TAM contacted — warn when approaching exhaustion
  HARD_NO_CRITICAL: 60, // % hard NOs of all touched — critical when rejection rate too high
} as const;

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
