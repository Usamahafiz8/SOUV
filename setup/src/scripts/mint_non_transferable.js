//Mints a non-transferable NonTransferablePlatform NFT and transfers it to a recipient.
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });
const keypair = new Ed25519Keypair(); // Replace with your keypair
const packageId = 'YOUR_PACKAGE_ID'; // Replace with your deployed package ID
const clockId = '0x6'; // Sui clock object ID

async function mintNonTransferable(eventId, supplyCapId, recipientAddress) {
    try {
        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${packageId}::moments::mint_non_transferable`,
            arguments: [
                tx.object(eventId),
                tx.object(supplyCapId),
                tx.pure.address(recipientAddress),
                tx.object(clockId),
            ],
            typeArguments: ['souv::moments::SOUV1'], // Adjust SOUV type as needed
        });

        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
        });

        console.log('Minted non-transferable:', result);
        return result;
    } catch (error) {
        console.error('Error minting non-transferable:', error);
        throw error;
    }
}

// Example usage
// mintNonTransferable('EVENT_ID', 'SUPPLY_CAP_ID', 'RECIPIENT_ADDRESS');