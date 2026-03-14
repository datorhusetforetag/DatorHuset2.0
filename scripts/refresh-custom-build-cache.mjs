import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

import { CUSTOM_BUILD_CATALOG_ITEMS } from "../src/data/customBuildCatalog.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const port = Number(process.env.CUSTOM_BUILD_REFRESH_PORT || 3301);
const serverPath = path.join(repoRoot, "server-local.js");
const baseUrl = `http://127.0.0.1:${port}`;
const maxConcurrency = Math.max(1, Number(process.env.CUSTOM_BUILD_REFRESH_CONCURRENCY || 2));
const waitBetweenRequestsMs = Math.max(0, Number(process.env.CUSTOM_BUILD_REFRESH_DELAY_MS || 250));
const allowedCategories = new Set(
  String(process.env.CUSTOM_BUILD_REFRESH_CATEGORIES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);
const allowedItemIds = new Set(
  String(process.env.CUSTOM_BUILD_REFRESH_ITEM_IDS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = async () => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60_000) {
    try {
      const response = await fetch(`${baseUrl}/api/custom-build/catalog-prices?category=cpu`);
      if (response.ok) return;
    } catch {}
    await sleep(1000);
  }
  throw new Error("Server did not start within 60 seconds.");
};

const refreshItem = async (item) => {
  const response = await fetch(
    `${baseUrl}/api/custom-build/catalog-offers?item_id=${encodeURIComponent(item.id)}&refresh=1`
  );
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${item.id} ${response.status} ${text.slice(0, 200)}`);
  }
  const data = await response.json();
  const offers = Array.isArray(data?.offers) ? data.offers : [];
  const pricedOffers = offers.filter(
    (offer) => offer?.status === "available" && Number.isFinite(offer?.total_price ?? offer?.price)
  );
  return {
    itemId: item.id,
    category: item.category,
    offers: offers.length,
    pricedOffers: pricedOffers.length,
    lowestPrice: Number.isFinite(data?.lowest_price) ? data.lowest_price : null,
    referenceSource: data?.reference_source || null,
  };
};

const runWithConcurrency = async (items, worker, concurrency) => {
  const results = [];
  let index = 0;

  const runNext = async () => {
    while (index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      const result = await worker(item, currentIndex);
      results[currentIndex] = result;
      if (waitBetweenRequestsMs > 0) {
        await sleep(waitBetweenRequestsMs);
      }
    }
  };

  await Promise.all(Array.from({ length: concurrency }, () => runNext()));
  return results;
};

const main = async () => {
  const server = spawn(process.execPath, [serverPath], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: process.env.NODE_ENV || "development",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const relay = (stream, target) => {
    stream.on("data", (chunk) => {
      target.write(chunk);
    });
  };
  relay(server.stdout, process.stdout);
  relay(server.stderr, process.stderr);

  try {
    await waitForServer();
    const itemsToRefresh = CUSTOM_BUILD_CATALOG_ITEMS.filter((item) => {
      if (allowedItemIds.size > 0) {
        return allowedItemIds.has(item.id);
      }
      if (allowedCategories.size > 0) {
        return allowedCategories.has(item.category);
      }
      return true;
    });
    const results = await runWithConcurrency(itemsToRefresh, refreshItem, maxConcurrency);
    const summaryByCategory = {};
    for (const result of results) {
      const bucket = (summaryByCategory[result.category] ||= {
        total: 0,
        withOffers: 0,
        withPricedOffers: 0,
        withReference: 0,
      });
      bucket.total += 1;
      if (result.offers > 0) bucket.withOffers += 1;
      if (result.pricedOffers > 0) bucket.withPricedOffers += 1;
      if (result.referenceSource) bucket.withReference += 1;
    }
    console.log(JSON.stringify({ total: results.length, byCategory: summaryByCategory }, null, 2));
  } finally {
    server.kill("SIGTERM");
    await new Promise((resolve) => server.once("exit", resolve));
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
