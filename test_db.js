async function test() {
  const { readFileSync } = await import("node:fs");
  const { createClient } = await import("@supabase/supabase-js");
  const envFile = readFileSync(".env.local", "utf8");
  const env = envFile.split("\n").reduce((acc, line) => {
    const [key, ...values] = line.split("=");
    if (key && values.length) acc[key.trim()] = values.join("=").trim();
    return acc;
  }, {});
  const supabase = createClient(
    env["SUPABASE_URL"],
    env["SUPABASE_ANON_KEY"],
  );

  const { count, error } = await supabase
    .from("admin_profiles")
    .select("id", { count: "exact", head: true });

  console.log("Supabase connection:", error ? "failed" : "ok");
  console.log("Visible admin profile count:", count ?? 0);
  if (error) console.error("Error:", error.message);
}

test();
