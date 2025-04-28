//Updates the supply limit of a SupplyCap.
import 'dotenv/config';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

// Load mnemonic from environment variables
const mnemonic = process.env.MNEMONIC || 'acoustic mango victory near beach machine hand lecture night broccoli media name';

// Initialize Sui client for testnet
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// Derive keypair from mnemonic
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

// Deployed package ID, admin cap ID, and supply cap ID
const packageId = '0x3e6297ed667f8a70b73bce1110d4062d483a7e07f5c1d3d2a7ba864af2f1bb72';
const adminCapId = '0xe805398b2bbe875c932120ad6d87b3ff100410aa1174848fc3313c4cc3da3ca4';
const supplyCapId = '0x7a5548a82e123b1b7f6eecc1bbce48089a7a91a3e6094bb3506fa22dcb6402b1';

async function updateSupply(adminCapId, supplyCapId, newLimit) {
    try {
        console.log('Updating SupplyCap with new limit:', newLimit);
        console.log('Using package ID:', packageId);
        console.log('Using adminCap ID:', adminCapId);
        console.log('Using supplyCap ID:', supplyCapId);
        console.log('Signer address:', keypair.toSuiAddress());

        // Check signer balance
        const balance = await client.getBalance({ owner: keypair.toSuiAddress() });
        console.log('Signer balance:', balance.totalBalance, 'MIST');

        const tx = new Transaction();
        tx.moveCall({
            target: `${packageId}::moments::update_supply`,
            arguments: [
                tx.object(adminCapId),
                tx.object(supplyCapId),
                tx.pure.u64(newLimit),
            ],
            typeArguments: [`${packageId}::moments::SOUV1`],// Adjust SOUV type as needed
        });

        // Set explicit gas budget
        tx.setGasBudget(10000000); // 10M MIST (0.01 SUI)

        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: {
                showEffects: true,
                showEvents: true,
                showObjectChanges: true,
                showInput: true,
            },
        });

        // Check for mutated SupplyCap object
        const mutatedSupplyCap = result.objectChanges?.find(
            (change) => change.type === 'mutated' && change.objectId === supplyCapId
        );
        console.log('✅ Supply updated:', {
            supplyCapId: mutatedSupplyCap?.objectId || 'Not found',
            result: JSON.stringify(result, null, 2),
        });

        return result;
    } catch (error) {
        console.error('❌ Error updating supply:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    }
}

// Example usage
updateSupply(adminCapId, supplyCapId, 2000);