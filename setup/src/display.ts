import { Transaction } from "@mysten/sui/transactions";
import { SuiClient } from "@mysten/sui/client";
import { bcs } from "@mysten/sui/bcs";
import { SUI_NETWORK, getSigner } from "./config";
import dotenv from "dotenv";

dotenv.config();

const client = new SuiClient({
  url: SUI_NETWORK,
});

export type DisplayFieldsType = {
  keys: string[];
  values: string[];
};

export async function createDisplay() {
  try {
    console.log("Using network:", SUI_NETWORK);

    const tx = new Transaction();
    const signer = await getSigner();
    const signerAddress = signer.toSuiAddress();
    console.log("Signer address:", signerAddress);

    let displayObject: DisplayFieldsType = {
      keys: [
        "name",
        "image_url",
        "description",
        "project_url",
        "creator",
        "intellectual_property",
        "category",
      ],
      values: [
        "Restricted Transferable POAP NFT",
        "https://www.zilliondesigns.com/blog/wp-content/uploads/NFT.jpg",
        // "https://www.nftgators.com/wp-content/uploads/2021/12/how-to-transfer-an-nft-800x417.png",
        "A public transferable POAP NFT for event participation",
        "https://your-project.io",
        "osamaa",
        "All rights reserved",
        "POAP",
      ],
    };

    const publisherID = process.env.PUBLISHER_ID || "0xc6ecb1018fc985f2f9942208df885f4effd89d72eae8c62f4c0b72401c72cdba";
    const packageID = process.env.PACKAGE_ID || "0x76250d053f0241e6de137e6047ae41fa8d0aa4eef1335cea4e4569b1f8be5983";
    console.log("Using publisherID:", publisherID);
    console.log("Using packageID:", packageID);

    tx.setGasBudget(50000000);
    console.log("Gas budget set to 50,000,000 MIST");

    let display = tx.moveCall({
      target: "0x2::display::new_with_fields",
      arguments: [
        tx.object(publisherID),
        tx.pure(bcs.vector(bcs.string()).serialize(displayObject.keys)),
        tx.pure(bcs.vector(bcs.string()).serialize(displayObject.values)),
      ],
      typeArguments: [`${packageID}::moments::RestrictTransferable<${packageID}::moments::SOUV1>`],
    });
    console.log("Called new_with_fields for RestrictTransferable struct");

    tx.moveCall({
      target: "0x2::display::update_version",
      arguments: [display],
      typeArguments: [`${packageID}::moments::RestrictTransferable<${packageID}::moments::SOUV1>`],
    });
    console.log("Called update_version");

    tx.transferObjects([display], signerAddress);
    console.log("Transferred Display object to signer");

    console.log("Executing transaction...");
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
        showInput: true,
      },
    });

    console.log("Transaction result:", JSON.stringify(result, null, 2));

    if (result.effects?.status.status !== "success") {
      throw new Error(`Transaction failed: ${result.effects?.status.error}`);
    }

    const displayId = result.objectChanges?.find(
      (change) =>
        change.type === "created" &&
        change.objectType === `0x2::display::Display<${packageID}::moments::Platform<${packageID}::moments::SOUV1>>`
    );

    if (!displayId) {
      throw new Error("Failed to retrieve Display object ID");
    }

    console.log(`Display created successfully with ID: ${displayId}`);
    return displayId;
  } catch (error) {
    console.error("Error creating display:", error);
    throw error;
  }
}

export async function createNonTransferableDisplay(souvType: string) {
  try {
    console.log("Using network:", SUI_NETWORK);

    const tx = new Transaction();
    const signer = await getSigner();
    const signerAddress = signer.toSuiAddress();
    console.log("Signer address:", signerAddress);

    let displayObject: DisplayFieldsType = {
      keys: [
        "name",
        "image_url",
        "description",
        "project_url",
        "creator",
        "intellectual_property",
        "category",
      ],
      values: [
        `Non-Transferable POAP NFT (${souvType})`,
        "https://your-project.io/non-transferable.png",
        `A non-transferable POAP NFT for event participation (${souvType})`,
        "https://your-project.io",
        "osamaa",
        "All rights reserved",
        "POAP",
      ],
    };

    const publisherID = process.env.PUBLISHER_ID || "0x87b217e370d3bac5bce379d8415036dd5877f5c127f46db455991ae6ac437489";
    const packageID = process.env.PACKAGE_ID || "0x4395cba275ef3bb4414565e5d7c7faba70592b1905150a71e4722a7bcf6bc56c";
    console.log("Using publisherID:", publisherID);
    console.log("Using packageID:", packageID);

    tx.setGasBudget(50000000);
    console.log("Gas budget set to 50,000,000 MIST");

    let display = tx.moveCall({
      target: "0x2::display::new_with_fields",
      arguments: [
        tx.object(publisherID),
        tx.pure(bcs.vector(bcs.string()).serialize(displayObject.keys)),
        tx.pure(bcs.vector(bcs.string()).serialize(displayObject.values)),
      ],
      typeArguments: [`${packageID}::moments::RestrictTransferable<${packageID}::moments::${souvType}>`],
    });
    console.log(`Called new_with_fields for RestrictTransferable<${souvType}>`);

    tx.moveCall({
      target: "0x2::display::update_version",
      arguments: [display],
      typeArguments: [`${packageID}::moments::RestrictTransferable<${packageID}::moments::${souvType}>`],
    });
    console.log("Called update_version");

    tx.transferObjects([display], signerAddress);
    console.log("Transferred Display object to signer");

    console.log("Executing transaction...");
    const result = await client.signAndExecuteTransaction({
      transaction: tx,
      signer: signer,
      options: {
        showEffects: true,
        showObjectChanges: true,
        showEvents: true,
        showInput: true,
      },
    });

    console.log("Transaction result:", JSON.stringify(result, null, 2));

    if (result.effects?.status.status !== "success") {
      throw new Error(`Transaction failed: ${result.effects?.status.error}`);
    }

    const displayId = result.objectChanges?.find(
      (change) =>
        change.type === "created" &&
        change.objectType === `0x2::display::Display<${packageID}::moments::RestrictTransferable<${packageID}::moments::${souvType}>>`
    );

    if (!displayId) {
      throw new Error("Failed to retrieve Display object ID");
    }

    console.log(`Display created successfully with ID: ${displayId}`);
    return displayId;
  } catch (error) {
    console.error(`Error creating display for ${souvType}:`, error);
    throw error;
  }
}

createDisplay().catch((err) => {
  console.error("Failed to create display:", err);
});