import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { bcs } from "@mysten/sui/bcs";
import { SUI_NETWORK, getSigner } from "./config";
import dotenv from "dotenv";

dotenv.config();

const client = new SuiClient({ url: SUI_NETWORK });

// Constants
const PUBLISHER_ID = process.env.PUBLISHER_ID || "0x0867928c1d52c5dcb9ffa99721be7015eb6cb91e2e43e614b33784b7072260c0";
const PACKAGE_ID = process.env.PACKAGE_ID || "0x4fdeee7e430e86fee9f19629e57e4d8161d0788a1962269398c7186c5cc4288a";

//     const publisherID = "0x0867928c1d52c5dcb9ffa99721be7015eb6cb91e2e43e614b33784b7072260c0";
//     const packageID = "0x4fdeee7e430e86fee9f19629e57e4d8161d0788a1962269398c7186c5cc4288a";
const GAS_BUDGET = 50000000;
const DISPLAY_FIELDS = {
  keys: ["name", "image_url", "description", "project_url", "creator", "intellectual_property", "category"],
  values: [
    "Restricted Transferable POAP NFT 1111",
    "https://images.ctfassets.net/aq13lwl6616q/34hurmvc7yzAeeS7jN6mDi/45619435580c8c0bf8550d13933ecd40/nft_101_cover_photo.png",
    "A public transferable POAP NFT for event participation",
    "https://your-project.io",
    "osamaa",
    "All rights reserved",
    "POAP",
  ],
};

// Types
export type DisplayFieldsType = {
  keys: string[];
  values: string[];
};

// Utility function for logging
const log = (message: string, data?: any) => {
  console.log(message, data ? JSON.stringify(data, null, 2) : "");
};

// Create type argument for moveCall
const getTypeArgument = (packageId: string, transferableName: string, souvType: string) =>
  `${packageId}::moments::${transferableName}<${packageId}::moments::${souvType}>`;

export async function createDisplay({ transferableName, souvType }: { transferableName: string; souvType: string }) {
  try {
    log(`Using network: ${SUI_NETWORK}`);
    log(`Using publisherID: ${PUBLISHER_ID}`);
    log(`Using packageID: ${PACKAGE_ID}`);

    const tx = new Transaction();
    const signer = await getSigner();
    const signerAddress = signer.toSuiAddress();
    log(`Signer address: ${signerAddress}`);

    tx.setGasBudget(GAS_BUDGET);
    log(`Gas budget set to ${GAS_BUDGET} MIST`);

    const typeArg = getTypeArgument(PACKAGE_ID, transferableName, souvType);

    const display = tx.moveCall({
      target: "0x2::display::new_with_fields",
      arguments: [
        tx.object(PUBLISHER_ID),
        tx.pure(bcs.vector(bcs.string()).serialize(DISPLAY_FIELDS.keys)),
        tx.pure(bcs.vector(bcs.string()).serialize(DISPLAY_FIELDS.values)),
      ],
      typeArguments: [typeArg],
    });
    log("Called new_with_fields for RestrictTransferable struct");

    tx.moveCall({
      target: "0x2::display::update_version",
      arguments: [display],
      typeArguments: [typeArg],
    });
    log("Called update_version");

    tx.transferObjects([display], signerAddress);
    log("Transferred Display object to signer");

    log("Executing transaction...");
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
        showInput: true,
      },
    });

    log("Transaction result:", result);

    if (result.effects?.status.status !== "success") {
      throw new Error(`Transaction failed: ${result.effects?.status.error}`);
    }

    const displayId = result.objectChanges?.find(
      (change) => change.type === "created" && change.objectType === typeArg
      // @ts-ignore
    )?.objectId;

    if (!displayId) {
      throw new Error("Failed to retrieve Display object ID");
    }

    log(`Display created successfully with ID: ${displayId}`);
    return displayId;
  } catch (error) {
    console.error("Error creating display:", error);
    throw error;
  }
}

createDisplay({
  transferableName: "RestrictTransferable",
  souvType: "SOUV1",
}).catch((err) => {
  console.error("Failed to create display:", err);
});