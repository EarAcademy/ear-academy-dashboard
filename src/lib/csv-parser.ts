import Papa from "papaparse";

export interface ParsedSchool {
  name: string;
  region: string;
  type?: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
}

export interface CSVParseResult {
  valid: ParsedSchool[];
  errors: string[];
}

export function parseSchoolCSV(csvText: string): CSVParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const valid: ParsedSchool[] = [];
  const errors: string[] = [];

  if (result.errors.length > 0) {
    result.errors.forEach((e) => {
      errors.push(`Row ${e.row}: ${e.message}`);
    });
  }

  result.data.forEach((row, index) => {
    const name = row.name?.trim();
    const region = row.region?.trim();

    if (!name) {
      errors.push(`Row ${index + 2}: Missing required field "name"`);
      return;
    }
    if (!region) {
      errors.push(`Row ${index + 2}: Missing required field "region"`);
      return;
    }

    valid.push({
      name,
      region,
      type: row.type?.trim() || undefined,
      email: row.email?.trim() || undefined,
      phone: row.phone?.trim() || undefined,
      contactPerson:
        row.contact_person?.trim() || row.contactperson?.trim() || undefined,
    });
  });

  return { valid, errors };
}
