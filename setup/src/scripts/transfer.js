//Transfers a RestrictTransferable NFT with signature verification.
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';

const client = new SuiClient({ url: getFullnodeUrl('testnet') });
const keypair = new Ed25519Keypair(); // Replace with your keypair
const packageId = 'YOUR_PACKAGE_ID'; // Replace with your deployed package ID

async function transfer(recipientAddress, poapId, publicKeysId, signedData, msg) {
    try {
        const tx = new TransactionBlock();
        tx.moveCall({
            target: `${packageId}::moments::transfer`,
            arguments: [
                tx.pure.address(recipientAddress),
                tx.object(poapId),
                tx.object(publicKeysId),
                tx.pure.vector('u8', signedData),
                tx.pure.vector('u8', msg),
            ],
            typeArguments: ['souv::moments::SOUV1'], // Adjust SOUV type as needed
        });

        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
        });

        console.log('Transferred:', result);
        return result;
    } catch (error) {
        console.error('Error transferring:', error);
        throw error;
    }
}

// Example usage
// transfer('RECIPIENT_ADDRESS', 'POAP_ID', 'PUBLIC_KEYS_ID', [/* signedData */], [/* msg */]);