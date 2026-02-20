import assert from "node:assert/strict";

const apiBase = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "";
const token = process.env.ADMIN_TOKEN || "";

if (!apiBase || !token) {
  console.log("Skipping admin v2 smoke test: set API_BASE_URL and ADMIN_TOKEN.");
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const run = async () => {
  const listingsRes = await fetch(`${apiBase}/api/admin/v2/listings?limit=2`, { headers });
  assert.equal(listingsRes.ok, true, "GET /api/admin/v2/listings should return 200");
  const listingsJson = await listingsRes.json();
  assert.equal(Array.isArray(listingsJson?.data), true, "listings response should contain data[]");

  if (listingsJson.data.length > 0) {
    const listingId = listingsJson.data[0].id;
    assert.equal(typeof listingId, "string", "listing id should be a string");

    const fpsRes = await fetch(`${apiBase}/api/admin/v2/listings/${listingId}/fps`, { headers });
    assert.equal(fpsRes.ok, true, "GET /api/admin/v2/listings/:id/fps should return 200");
    const fpsJson = await fpsRes.json();
    assert.equal(Array.isArray(fpsJson?.data?.entries), true, "fps response should include entries[]");
  }

  const ordersRes = await fetch(`${apiBase}/api/admin/v2/orders?limit=2`, { headers });
  assert.equal(ordersRes.ok, true, "GET /api/admin/v2/orders should return 200");
  const ordersJson = await ordersRes.json();
  assert.equal(Array.isArray(ordersJson?.data), true, "orders response should contain data[]");

  console.log("Admin v2 smoke test passed.");
};

run().catch((error) => {
  console.error("Admin v2 smoke test failed:", error.message || error);
  process.exit(1);
});
