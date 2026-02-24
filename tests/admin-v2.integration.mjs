import assert from "node:assert/strict";

const apiBase = process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || "";
const token = process.env.ADMIN_TOKEN || "";
const runWriteTests = process.env.ADMIN_WRITE_TESTS === "1";

if (!apiBase || !token) {
  console.log("Skipping admin v2 integration test: set API_BASE_URL and ADMIN_TOKEN.");
  process.exit(0);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
};

const isBlockedLegacyImage = (value) => {
  const normalized = String(value || "").toLowerCase();
  return normalized.includes("chieftecvisio") || normalized.includes("placeholder");
};

const toListingWritePayload = (item) => ({
  name: String(item.name || ""),
  slug: String(item.slug || ""),
  legacy_id: String(item.legacy_id || ""),
  description: String(item.description || ""),
  image_url: String(item.image_url || ""),
  images: Array.isArray(item.images) ? item.images : [],
  price_cents: Number(item.price_cents || 0),
  currency: "SEK",
  cpu: String(item.cpu || ""),
  gpu: String(item.gpu || ""),
  ram: String(item.ram || ""),
  storage: String(item.storage || ""),
  storage_type: String(item.storage_type || ""),
  tier: String(item.tier || ""),
  motherboard: String(item.motherboard || ""),
  psu: String(item.psu || ""),
  case_name: String(item.case_name || ""),
  cpu_cooler: String(item.cpu_cooler || ""),
  os: String(item.os || ""),
  quantity_in_stock: Math.max(0, Number(item.quantity_in_stock || 0)),
  is_preorder: Boolean(item.is_preorder),
  eta_days: item.eta_days === null || item.eta_days === undefined ? null : Number(item.eta_days),
  eta_note: String(item.eta_note || ""),
  used_variant_enabled: Boolean(item.used_variant_enabled),
  listing_group_id: item.listing_group_id || null,
  expected_updated_at: item.updated_at || null,
});

const run = async () => {
  const listingsRes = await fetch(`${apiBase}/api/admin/v2/listings?limit=50`, { headers });
  assert.equal(listingsRes.ok, true, "GET /api/admin/v2/listings should return 200");
  const listingsJson = await listingsRes.json();
  assert.equal(Array.isArray(listingsJson?.data), true, "listings response should contain data[]");
  assert.equal(listingsJson.data.length > 0, true, "listings should contain at least one row");

  const sample = listingsJson.data[0];
  assert.equal(
    Object.prototype.hasOwnProperty.call(sample, "listing_group_id"),
    true,
    "listing should expose listing_group_id"
  );

  for (const row of listingsJson.data.slice(0, 8)) {
    const imageRes = await fetch(`${apiBase}/api/product-images/${row.id}`);
    assert.equal(imageRes.ok, true, "GET /api/product-images/:id should return 200");
    const imageJson = await imageRes.json();
    assert.equal(Array.isArray(imageJson?.images), true, "product images should include images[]");
    assert.equal(
      imageJson.images.some((entry) => isBlockedLegacyImage(entry)),
      false,
      "blocked legacy placeholder images must not be returned"
    );

    const usedPartsRes = await fetch(`${apiBase}/api/used-parts/${row.id}`);
    assert.equal(usedPartsRes.ok, true, "GET /api/used-parts/:id should return 200");
    const usedPartsJson = await usedPartsRes.json();
    assert.equal(typeof usedPartsJson?.configured, "boolean", "used-parts response should include configured flag");
  }

  const paired = listingsJson.data.find((entry) => entry.linked_product_id);
  if (paired) {
    const [aRes, bRes] = await Promise.all([
      fetch(`${apiBase}/api/admin/v2/listings/${paired.id}`, { headers }),
      fetch(`${apiBase}/api/admin/v2/listings/${paired.linked_product_id}`, { headers }),
    ]);
    assert.equal(aRes.ok, true, "paired listing A fetch should return 200");
    assert.equal(bRes.ok, true, "paired listing B fetch should return 200");
    const aJson = await aRes.json();
    const bJson = await bRes.json();
    assert.equal(
      String(aJson?.data?.listing_group_id || ""),
      String(bJson?.data?.listing_group_id || ""),
      "paired variants should share listing_group_id"
    );
  }

  if (runWriteTests) {
    const listing = listingsJson.data[0];
    const body = {
      listing: toListingWritePayload(listing),
      fps: listing.fps || { version: 2, entries: [] },
      used_parts: listing.used_parts || {},
      expected_updated_at: listing.updated_at || null,
    };
    const writeRes = await fetch(`${apiBase}/api/admin/v2/listings/${listing.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    assert.equal(writeRes.ok, true, "PUT /api/admin/v2/listings/:id no-op update should return 200");
    const writeJson = await writeRes.json();
    assert.equal(writeJson?.ok, true, "write response should contain ok=true");
  } else {
    console.log("Skipping write integration subtest (set ADMIN_WRITE_TESTS=1 to enable).");
  }

  console.log("Admin v2 integration test passed.");
};

run().catch((error) => {
  console.error("Admin v2 integration test failed:", error.message || error);
  process.exit(1);
});
