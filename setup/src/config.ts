import { config } from "dotenv";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

config({});

const signer = async () => {
  const keypair = Ed25519Keypair.deriveKeypair('acoustic mango victory near beach machine hand lecture night broccoli media name');

  return keypair;
}

export const SUI_NETWORK = process.env.SUI_NETWORK as string;
export const getSigner = async () => await signer();
