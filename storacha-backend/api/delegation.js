import * as Client from "@storacha/client";
import * as Proof from "@storacha/client/proof";
import { Signer } from "@storacha/client/principal/ed25519";
import { StoreMemory } from "@storacha/client/stores/memory";

/**
 * Vercel Serverless handler (GET /api/delegation?did=<DID>)
 */
export default async function handler(req, res) {
  try {
    // accept did via query param
    const did = Array.isArray(req.query.did) ? req.query.did[0] : req.query.did;
    if (!did) return res.status(400).json({ error: "missing did query param" });

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
    return res.status(200).send(archive.ok);
  } catch (err) {
    console.error("delegation error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
