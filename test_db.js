const fs = require("fs");
const envFile = fs.readFileSync(".env.local", "utf8");
const env = envFile.split("\n").reduce((acc, line) => {
  const [key, ...values] = line.split("=");
  if (key && values.length) acc[key.trim()] = values.join("=").trim();
  return acc;
}, {});

const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  env["NEXT_PUBLIC_SUPABASE_URL"],
  env["NEXT_PUBLIC_SUPABASE_ANON_KEY"],
);

async function test() {
  console.log("URL", env["NEXT_PUBLIC_SUPABASE_URL"]);
  const { data, error } = await supabase.from("admin_profiles").select("*");
  console.log("=== admin_profiles ===");
  console.log("data length:", data ? data.length : 0);
  console.log("data:", data);
  if (error) console.error("error:", error);

  if (data && data.length > 0) {
    const code = data[0].school_code;
    const { data: row, error: err } = await supabase
      .from("admin_profiles")
      .select("school_code")
      .eq("school_code", code)
      .single();
    console.log(`\n=== admin_profiles (eq ${code}) ===`);
    console.log("row:", row, "err:", err);
  } else {
    console.log("\n=== Testing arbitrary code ===");
    const code = "ABCDEF";
    const { data: row, error: err } = await supabase
      .from("admin_profiles")
      .select("school_code")
      .eq("school_code", code)
      .single();
    console.log("row:", row, "err:", err);
  }
}

test();
