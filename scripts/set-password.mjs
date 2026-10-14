// One-off admin password reset — bypasses email entirely.
//
// Run from the project root:
//   SUPABASE_SERVICE_ROLE_KEY='your-service-role-key' \
//   NEW_PASSWORD='your-new-password' \
//   node scripts/set-password.mjs
//
// Get the service-role key from: Supabase dashboard → Project Settings → API
//   → "service_role" secret (NOT the anon key). Keep it secret; don't commit it.

import { createClient } from "@supabase/supabase-js";

const url =
  process.env.SUPABASE_URL || "https://runmkzsncmylpvraabmj.supabase.co";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.TARGET_EMAIL || "bendelarosa@utexas.edu";
const password = process.env.NEW_PASSWORD;

if (!serviceKey || !password) {
  console.error(
    "Missing env vars. Set SUPABASE_SERVICE_ROLE_KEY and NEW_PASSWORD."
  );
  process.exit(1);
}
if (password.length < 6) {
  console.error("NEW_PASSWORD must be at least 6 characters.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Find the user by email (paginate in case there are many users).
let user = null;
for (let page = 1; page <= 20; page++) {
  const { data, error } = await admin.auth.admin.listUsers({
    page,
    perPage: 200,
  });
  if (error) {
    console.error("listUsers failed:", error.message);
    process.exit(1);
  }
  user = data.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );
  if (user || data.users.length < 200) break;
}

if (!user) {
  console.error(`No user found with email ${email}`);
  process.exit(1);
}

const { error } = await admin.auth.admin.updateUserById(user.id, { password });
if (error) {
  console.error("Password update failed:", error.message);
  process.exit(1);
}

console.log(`✅ Password updated for ${email}. You can now sign in.`);
