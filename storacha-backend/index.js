import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import * as Client from "@storacha/client";
import * as Proof from "@storacha/client/proof";
import { Signer } from "@storacha/client/principal/ed25519";
import { StoreMemory } from "@storacha/client/stores/memory";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/api/delegation/:did", async (req, res) => {
  try {
    const { did } = req.params;

    const principal = Signer.parse(process.env.STORACHA_PRINCIPAL);
    const store = new StoreMemory();
    const client = await Client.create({ principal, store });

    const proof = await Proof.parse(process.env.STORACHA_PROOF);
    const space = await client.addSpace(proof);
    await client.setCurrentSpace(space.did());

    const abilities = [
      "space/blob/add",
      "space/index/add",
      "filecoin/offer",
      "upload/add",
    ];

    // Expire in 1 year
    const expiration = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365;

    const delegation = await client.createDelegation(did, abilities, {
      expiration,
    });

    const archive = await delegation.archive();
    res.setHeader("Content-Type", "application/octet-stream");
    res.send(archive.ok);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Storacha backend running on port ${PORT}`)
);
