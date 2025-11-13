// src/storachaClient.js
import { create } from "@storacha/client";

let client = null;

export async function getClient() {
  if (client) return client;

  try {
    client = await create({
      service: "https://api.web3.storage", // fallback endpoint for Storacha
    });

    // Ensure current space is set if exists
    const spaces = await client.spaces.list();
    if (spaces && spaces.length > 0) {
      await client.setCurrentSpace(spaces[0].did());
    }

    return client;
  } catch (err) {
    console.error("❌ Storacha client init failed:", err);
    throw err;
  }
}
