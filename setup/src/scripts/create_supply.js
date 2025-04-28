import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';

// Load mnemonic from environment variables
const mnemonic = process.MNEMONIC || 'acoustic mango victory near beach machine hand lecture night broccoli media name';

// Initialize Sui client for testnet
const client = new SuiClient({ url: getFullnodeUrl('testnet') });

// Derive keypair from mnemonic
const keypair = Ed25519Keypair.deriveKeypair(mnemonic);

// Deployed package ID and admin cap ID
const packageId = '0x3e6297ed667f8a70b73bce1110d4062d483a7e07f5c1d3d2a7ba864af2f1bb72';
const adminCapId = '0xe805398b2bbe875c932120ad6d87b3ff100410aa1174848fc3313c4cc3da3ca4';

async function createSupplyCap(supplyLimit = null) {
    try {
        console.log('Creating SupplyCap with limit:', supplyLimit);
        console.log('Using package ID:', packageId);
        console.log('Using adminCap ID:', adminCapId);
        console.log('Signer address:', keypair.toSuiAddress());

        // Check signer balance
        const balance = await client.getBalance({ owner: keypair.toSuiAddress() });
        console.log('Signer balance:', balance.totalBalance, 'MIST');

        const tx = new Transaction();

        // Call create_supply_cap and capture the returned SupplyCap<T> object
        const supplyCapObj = tx.moveCall({
            target: `${packageId}::moments::create_supply_cap`,
            arguments: [
                tx.object(adminCapId),
                tx.pure.option('u64', supplyLimit), // Properly serialize Option<u64>
            ],
            typeArguments: [`${packageId}::moments::SOUV1`],
        });

        // Transfer the SupplyCap<T> object to the signer
        tx.moveCall({
            target: '0x2::transfer::public_transfer',
            arguments: [
                supplyCapObj,
                tx.pure.address(keypair.toSuiAddress()),
            ],
            typeArguments: [`${packageId}::moments::SupplyCap<${packageId}::moments::SOUV1>`],
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

        // Find the created SupplyCap object
        const createdSupplyCap = result.objectChanges?.find(
            (change) => change.type === 'created' && change.objectType.includes('::moments::SupplyCap')
        );
        console.log('✅ SupplyCap created:', {
            objectId: createdSupplyCap?.objectId || 'Not found',
            result: JSON.stringify(result, null, 2),
        });

        return result;
    } catch (error) {
        console.error('❌ Error creating SupplyCap:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    }
}

// Example usage
createSupplyCap(1000); // Example supply limit of 1000