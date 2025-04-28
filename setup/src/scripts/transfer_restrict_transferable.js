//Transfers a RestrictTransferable NFT with admin authorization.
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });
const keypair = new Ed25519Keypair(); // Replace with your keypair
const packageId = 'YOUR_PACKAGE_ID'; // Replace with your deployed package ID
const clockId = '0x6'; // Sui clock object ID

async function transferRestrictTransferable(adminCapId, poapId, eventId, recipientAddress) {
    try {
        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${packageId}::moments::transfer_restrict_transferable`,
            arguments: [
                tx.object(adminCapId),
                tx.object(poapId),
                tx.object(eventId),
                tx.pure.address(recipientAddress),
                tx.object(clockId),
            ],
            typeArguments: ['souv::moments::SOUV1'], // Adjust SOUV type as needed
        });

        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
        });

        console.log('Restrict transferable transferred:', result);
        return result;
    } catch (error) {
        console.error('Error transferring restrict transferable:', error);
        throw error;
    }
}

// Example usage
// transferRestrictTransferable('ADMIN_CAP_ID', 'POAP_ID', 'EVENT_ID', 'RECIPIENT_ADDRESS');