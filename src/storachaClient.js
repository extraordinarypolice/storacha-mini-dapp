import { StorachaClient } from "@storacha/client";

// Singleton Storacha client setup
let client = null;

export async function getClient() {
  if (client) return client;

  const c = new StorachaClient({
    endpoint: "https://api.storacha.network", // ✅ official Storacha remote API
  });

  await c.connect();
  client = c;
  return c;
}
