// const { Ed25519Keypair } = require("@mysten/sui.js/keypairs/ed25519");
// const { toB64, fromB64 } = require("@mysten/sui.js/utils");
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { toB64, fromB64 } from "@mysten/sui/utils";

// Store the last created keypair
let keypair;

function initializeKeypair(privateKeyBase64) {
  if (!keypair) {
    const privateKeyBytes = fromB64(privateKeyBase64);
    keypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
  }
  return keypair;
}

function signMessageWithNonce(privateKeyBase64, nonce) {
  // Initialize or reuse the keypair
  const keypair = initializeKeypair(privateKeyBase64);
  const publicKey = keypair.getPublicKey().toRawBytes();

  // Message
  const message = new Uint8Array([
    104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
  ]); // "hello world"

  // Create nonce bytes
  const nonceBytes = new Uint8Array(8);
  for (let i = 0; i < 8; i++) {
    nonceBytes[i] = (nonce >> (i * 4)) & 0xff;
  }

  // Create signed message
  const signedMsg = new Uint8Array([...message, ...nonceBytes]);

  // Sign the message
  const signature = keypair.signData(signedMsg);

  return {
    publicKey: Array.from(publicKey),
    privateKey: privateKeyBase64,
    message: Array.from(message),
    nonce: nonce,
    signature: Array.from(signature),
  };
}

// Example Usage
const privateKeyBase64 = "AAAAAAAAAAAAAAEAAAAAAAgAAAgAAAUAAAAABgQAAAA="; // Provide your Base64 private key
const nonce = 0; // Provide the nonce value

const result = signMessageWithNonce(privateKeyBase64, nonce);
console.log("Updated Signature Result:", JSON.stringify(result, null, 0))