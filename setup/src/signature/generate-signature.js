import { Ed25519Keypair, Ed25519PublicKey } from "@mysten/sui/keypairs/ed25519";
import { toB64, fromB64 } from "@mysten/sui/utils";

// Store the last created keypair
let keypair;

function initializeKeypair(privateKeyBase64) {
  if (!keypair) {
    if (privateKeyBase64) {
      // Decode Base64 private key and ensure 32-byte seed
      const privateKeyBytes = fromB64(privateKeyBase64);
      const seed = privateKeyBytes.slice(0, 32); // Strip any flag byte
      keypair = Ed25519Keypair.fromSecretKey(seed);
    } else {
      // Generate a new keypair
      keypair = new Ed25519Keypair();
    }
  }
  return keypair;
}

async function signMessageWithNonce(privateKeyBase64, message, nonce) {
  try {
    // Initialize or reuse the keypair
    const keypair = initializeKeypair(privateKeyBase64);
    const publicKey = keypair.getPublicKey().toRawBytes();

    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);

    // Encode nonce as 8-byte Uint8Array (big-endian)
    const nonceBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
      nonceBytes[7 - i] = (nonce >> (i * 8)) & 0xff; // Big-endian
    }

    // Combine message and nonce
    const signedMsg = new Uint8Array([...messageBytes, ...nonceBytes]);

    // Sign the combined message
    const signature = await keypair.sign(signedMsg);

    return {
      publicKey: Array.from(publicKey),
      privateKey: privateKeyBase64 || toB64(keypair.getSecretKey()),
      message: Array.from(messageBytes),
      nonce: nonce,
      nonceBytes: Array.from(nonceBytes),
      signature: Array.from(signature),
    };
  } catch (error) {
    console.error(`Error signing message with nonce ${nonce}:`, error);
    throw error;
  }
}

async function verifySignature(result) {
  try {
    const publicKey = new Ed25519PublicKey(new Uint8Array(result.publicKey));
    const message = new Uint8Array(result.message);
    const nonceBytes = new Uint8Array(result.nonceBytes);
    const signedMsg = new Uint8Array([...message, ...nonceBytes]);
    const signature = new Uint8Array(result.signature);

    const isValid = await publicKey.verify(signedMsg, signature);
    console.log(`Signature Valid for nonce ${result.nonce}:`, isValid);
    return isValid;
  } catch (error) {
    console.error(`Error verifying signature for nonce ${result.nonce}:`, error);
    throw error;
  }
}

// Generate signatures for nonces 0 to 4
(async () => {
  try {
    // Use a generated keypair or provide a Base64 private key
    const privateKeyBase64 = ""; // Leave empty to generate a new keypair
    const message = "hello world";
    const results = [];

    // Generate signatures for nonces 0 to 4
    for (let nonce = 0; nonce <= 4; nonce++) {
      const result = await signMessageWithNonce(privateKeyBase64, message, nonce);
      results.push(result);
      await verifySignature(result);
    }

    console.log("All Signatures:", JSON.stringify(results, null, 2));
  } catch (error) {
    console.error("Failed to generate signatures:", error);
  }
})();