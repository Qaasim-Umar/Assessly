import { supabase } from "@/lib/supabase";

export interface CboCentreLocation {
  state: string;
  lga: string;
}

export interface PublicCboCentre {
  sn: number;
  cyber_cafe: string;
  office_address: string;
  town: string | null;
  state: string;
  lga: string;
  phone_number: string | null;
  alternative_phone_number: string | null;
}

const PUBLIC_CENTRE_COLUMNS =
  "sn,cyber_cafe,office_address,town,state,lga,phone_number,alternative_phone_number";

export async function getCboCentreLocations(): Promise<CboCentreLocation[]> {
  const { data, error } = await supabase
    .from("cbo_centre_locations")
    .select("state,lga")
    .order("state", { ascending: true })
    .order("lga", { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).filter(
    (location): location is CboCentreLocation =>
      typeof location.state === "string" &&
      location.state.trim().length > 0 &&
      typeof location.lga === "string" &&
      location.lga.trim().length > 0,
  );
}

export async function getCboCentresByLocation(
  state: string,
  lga: string,
): Promise<PublicCboCentre[]> {
  const { data, error } = await supabase
    .from("cbo_centres_public")
    .select(PUBLIC_CENTRE_COLUMNS)
    .eq("state", state)
    .eq("lga", lga)
    .order("cyber_cafe", { ascending: true })
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PublicCboCentre[];
}
