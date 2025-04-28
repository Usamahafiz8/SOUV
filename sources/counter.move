module souv::counter_v2 {
    use sui::dynamic_field::{Self};
    

    public struct AssetKey<phantom T> has copy, store, drop {}

    public struct Counter has key, store {
        id: UID,
        version: u16,
    }

    public fun new_counter(ctx: &mut TxContext): Counter {
        Counter {
            id: object::new(ctx),
            version: 0,
        }
    }

    public fun version(counter: &Counter): u16 {
        counter.version
    }

    public fun add_mint_field<T>(counter: &mut Counter) {
        dynamic_field::add(&mut counter.id, AssetKey<T> {}, 0u64);
    }

    public fun incr_mint<T>(counter: &mut Counter) {
        let counter_ref = dynamic_field::borrow_mut(&mut counter.id, AssetKey<T> {});
        *counter_ref = *counter_ref + 1;
    }

    public fun num_minted<T>(counter: &Counter): u64 {
        if (dynamic_field::exists_(&counter.id, AssetKey<T> {})) {
            *dynamic_field::borrow(&counter.id, AssetKey<T> {})
        } else {
            0
        }
    }

    public fun add_existing_mints<T>(counter: &mut Counter, minted: u64) {
        dynamic_field::add(&mut counter.id, AssetKey<T> {}, minted);
    }

    #[test_only]
    public fun upgrade_version(counter: &mut Counter) {
        counter.version = counter.version + 1;
    }
}