import express from "express";
import cors from "cors";
import * as Client from "@storacha/client";
import * as Proof from "@storacha/client/proof";
import { StoreMemory } from "@storacha/client/stores/memory";
import { Signer } from "@storacha/client/principal/ed25519";
import * as DID from "@ipld/dag-ucan/did";
import * as Delegation from "@storacha/client/delegation";

const app = express();
app.use(cors());
app.use(express.json());

// --- Load env vars ---
const KEY = process.env.STORACHA_KEY;
const PROOF = process.env.STORACHA_PROOF;

// --- Helper: create 1-year delegation ---
async function createDelegationFor(did) {
  const principal = Signer.parse(KEY);
  const store = new StoreMemory();
  const client = await Client.create({ principal, store });

  const proof = await Proof.parse(PROOF);
  const space = await client.addSpace(proof);
  await client.setCurrentSpace(space.did());

  const audience = DID.parse(did);
  const abilities = [
    "space/blob/add",
    "space/index/add",
    "filecoin/offer",
    "upload/add",
  ];

  // Expire in 1 year
  const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;

  const delegation = await client.createDelegation(audience, abilities, {
    expiration,
  });

  const archive = await delegation.archive();
  return archive.ok;
}

// --- API: create or refresh delegation ---
app.get("/api/delegation/:did", async (req, res) => {
  try {
    const { did } = req.params;
    console.log(`Creating delegation for: ${did}`);
    const archive = await createDelegationFor(did);
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(Buffer.from(archive));
  } catch (err) {
    console.error("Delegation error:", err);
    res.status(500).json({ error: "Failed to create delegation" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`✅ Storacha Delegation Server running on http://localhost:${PORT}`)
);
