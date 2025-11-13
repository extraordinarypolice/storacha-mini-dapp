import * as Client from "@storacha/client";
import * as Proof from "@storacha/client/proof";
import { Signer } from "@storacha/client/principal/ed25519";
import { StoreMemory } from "@storacha/client/stores/memory";
import "dotenv/config";

const principal = Signer.parse(process.env.STORACHA_PRINCIPAL);
const store = new StoreMemory();
const client = await Client.create({ principal, store });
const proof = await Proof.parse(process.env.STORACHA_PROOF);
const space = await client.addSpace(proof);
console.log("✅ Space DID:", space.did());
