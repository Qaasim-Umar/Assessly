import { supabase } from "./supabase";

export type CboCentreImportRow = {
  sn: number;
  cyber_cafe: string;
  office_address: string;
  town: string | null;
  state: string;
  lga: string;
  phone_number: string | null;
  alternative_phone_number: string | null;
  flagged: boolean;
};

export type CboCentreImportIssue = {
  row: number;
  sn: number | null;
  message: string;
};

export type CboCentreParseResult = {
  centres: CboCentreImportRow[];
  issues: CboCentreImportIssue[];
  sourceRowCount: number;
  stateCount: number;
  lgaCount: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getSourceRows(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (!isRecord(parsed)) {
    throw new Error("The JSON must be an array of CBO centres.");
  }

  const possibleArrays = [parsed.centres, parsed.centers, parsed.data];
  const wrappedRows = possibleArrays.find(Array.isArray);
  if (wrappedRows) return wrappedRows;

  throw new Error(
    "The JSON must be an array, or an object containing a centres array.",
  );
}

function requiredText(
  record: Record<string, unknown>,
  key: string,
  label: string,
  addIssue: (message: string) => void,
) {
  const value = record[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    addIssue(`${label} is required and must be text.`);
    return "";
  }
  return value.trim();
}

function optionalText(
  record: Record<string, unknown>,
  key: string,
  label: string,
  addIssue: (message: string) => void,
) {
  const value = record[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    addIssue(
      `${label} must be a quoted string so leading zeroes are preserved.`,
    );
    return null;
  }
  return value.trim() || null;
}

function parseSerialNumber(value: unknown) {
  if (typeof value === "number" && Number.isInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    const parsed = Number(value);
    if (Number.isSafeInteger(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export function parseCboCentreJson(raw: string): CboCentreParseResult {
  const cleaned = raw.replace(/^\uFEFF/, "").replace(/\\_/g, "_").trim();
  if (!cleaned) throw new Error("Choose a JSON file or paste JSON first.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Invalid JSON.";
    throw new Error(`This file is not valid JSON. ${detail}`);
  }

  const sourceRows = getSourceRows(parsed);
  if (sourceRows.length === 0) {
    throw new Error("The JSON array is empty.");
  }

  const centres: CboCentreImportRow[] = [];
  const issues: CboCentreImportIssue[] = [];
  const seenSerialNumbers = new Set<number>();

  sourceRows.forEach((value, index) => {
    const rowNumber = index + 1;
    if (!isRecord(value)) {
      issues.push({ row: rowNumber, sn: null, message: "Row must be an object." });
      return;
    }

    const sn = parseSerialNumber(value.sn);
    const rowIssues: string[] = [];
    const addIssue = (message: string) => rowIssues.push(message);

    if (sn === null) {
      addIssue("sn must be a positive whole number.");
    } else if (seenSerialNumbers.has(sn)) {
      addIssue(`sn ${sn} appears more than once in this file.`);
    }

    const cyberCafe = requiredText(value, "cyber_cafe", "cyber_cafe", addIssue);
    const officeAddress = requiredText(
      value,
      "office_address",
      "office_address",
      addIssue,
    );
    const town = optionalText(value, "town", "town", addIssue);
    const state = requiredText(value, "state", "state", addIssue);
    const lga = requiredText(value, "lga", "lga", addIssue);
    const phoneNumber = optionalText(
      value,
      "phone_number",
      "phone_number",
      addIssue,
    );
    const alternativePhoneNumber = optionalText(
      value,
      "alternative_phone_number",
      "alternative_phone_number",
      addIssue,
    );

    const flaggedValue = value.flagged;
    const flagged = flaggedValue === undefined ? false : flaggedValue;
    if (typeof flagged !== "boolean") {
      addIssue("An internal boolean field must be true or false.");
    }

    if (sn !== null) seenSerialNumbers.add(sn);

    if (rowIssues.length > 0 || sn === null || typeof flagged !== "boolean") {
      rowIssues.forEach((message) => {
        issues.push({ row: rowNumber, sn, message });
      });
      return;
    }

    centres.push({
      sn,
      cyber_cafe: cyberCafe,
      office_address: officeAddress,
      town,
      state,
      lga,
      phone_number: phoneNumber,
      alternative_phone_number: alternativePhoneNumber,
      flagged,
    });
  });

  return {
    centres,
    issues,
    sourceRowCount: sourceRows.length,
    stateCount: new Set(centres.map((centre) => centre.state.toLocaleLowerCase())).size,
    lgaCount: new Set(
      centres.map(
        (centre) =>
          `${centre.state.toLocaleLowerCase()}::${centre.lga.toLocaleLowerCase()}`,
      ),
    ).size,
  };
}

export async function upsertCboCentreBatch(rows: CboCentreImportRow[]) {
  const updatedAt = new Date().toISOString();

  const publicPayload = rows.map((row) => ({
    sn: row.sn,
    cyber_cafe: row.cyber_cafe,
    office_address: row.office_address,
    town: row.town,
    state: row.state,
    lga: row.lga,
    phone_number: row.phone_number,
    alternative_phone_number: row.alternative_phone_number,
  }));

  const { error: upsertError } = await supabase
    .from("cbo_centres")
    .upsert(publicPayload, { onConflict: "sn", ignoreDuplicates: false });

  if (upsertError) throw upsertError;

  for (const flagged of [false, true]) {
    const serialNumbers = rows
      .filter((row) => row.flagged === flagged)
      .map((row) => row.sn);

    if (serialNumbers.length === 0) continue;

    const { error: metadataError } = await supabase
      .from("cbo_centres")
      .update({ flagged, updated_at: updatedAt })
      .in("sn", serialNumbers);

    if (metadataError) throw metadataError;
  }
}

export async function fetchCboCentreCount() {
  const { count, error } = await supabase
    .from("cbo_centres_public")
    .select("sn", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}
