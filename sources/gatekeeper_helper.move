module souv::gatekeeper_helper {
    use souv::cap::AdminCap;
    use sui::ed25519;
    use sui::table::{Self, Table};
    use sui::bcs;

    const ESignatureNotVerified: u64 = 1;
    const EInvalidOwner: u64 = 2;
    const EPublicKeyNotFound: u64 = 3;
    const EInvalidSignedData: u64 = 5;

    public struct PublicKeys has key, store {
        id: UID,
        public_keys: vector<vector<u8>>, 
        nonce_list: Table<vector<u8>, u64>, 
    }

    public fun create_publickey_list(
        _: &AdminCap, 
        public_key_list: vector<vector<u8>>,
        ctx: &mut TxContext
    ) {
        let uid = object::new(ctx);
        let mut signature_wrapper = PublicKeys {
            id: uid,
            public_keys: public_key_list,
            nonce_list: table::new(ctx),
        };
        let mut i = 0;
        while (i < vector::length(&signature_wrapper.public_keys)) {
            let public_key = *vector::borrow(&signature_wrapper.public_keys, i);
            table::add(&mut signature_wrapper.nonce_list, public_key, 0);
            i = i + 1;
        };
        transfer::share_object(signature_wrapper);
    }

    public fun add_publickey(
         _: &AdminCap, 
        signature_wrapper: &mut PublicKeys,
        new_publickey: vector<vector<u8>>
    ) {
        let mut i = 0;
        while (i < vector::length(&new_publickey)) {
            let publickey = *vector::borrow(&new_publickey, i);
            vector::push_back(&mut signature_wrapper.public_keys, publickey);
            table::add(&mut signature_wrapper.nonce_list, publickey, 0);
            i = i + 1;
        }
    }

    public fun remove_publickey(
         _: &AdminCap, 
        signature_wrapper: &mut PublicKeys,
        public_key: vector<u8>
    ) {
        let mut i = 0;
        let mut found = false;
        while (i < vector::length(&signature_wrapper.public_keys)) {
            if (*vector::borrow(&signature_wrapper.public_keys, i) == public_key) {
                vector::swap_remove(&mut signature_wrapper.public_keys, i);
                found = true;
                break
            };
            i = i + 1;
        };
        assert!(found, EInvalidOwner);
        if (table::contains(&signature_wrapper.nonce_list, public_key)) {
            table::remove(&mut signature_wrapper.nonce_list, public_key);
        };
    }

    public entry fun verify_platform(
        signature_wrapper: &mut PublicKeys,
        signature: vector<u8>, 
        msg: vector<u8>,      
    ) {
        
        assert!(vector::length(&signature) == 64, EInvalidSignedData);

        let mut verified = false;
        let mut verifying_key = vector::empty<u8>();
        let len = vector::length(&signature_wrapper.public_keys);
        let mut i = 0;

        while (i < len) {
            let public_key = *vector::borrow(&signature_wrapper.public_keys, i);
            
            assert!(table::contains(&signature_wrapper.nonce_list, public_key), EPublicKeyNotFound);
            let nonce = *table::borrow(&signature_wrapper.nonce_list, public_key);
            let nonce_bytes = bcs::to_bytes(&nonce);
            let mut signed_msg = msg;
            
            vector::append(&mut signed_msg, nonce_bytes);
            let is_verified = ed25519::ed25519_verify(&signature, &public_key, &signed_msg);
            if (is_verified) {
                verified = true;
                verifying_key = public_key;
                break
            };
            i = i + 1;
        };
        assert!(verified, ESignatureNotVerified);

        let stored_nonce = *table::borrow(&signature_wrapper.nonce_list, verifying_key);
        table::remove(&mut signature_wrapper.nonce_list, verifying_key);
        table::add(&mut signature_wrapper.nonce_list, verifying_key, stored_nonce + 1);
    }

}