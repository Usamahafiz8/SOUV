module souv::moments {
    use sui::clock::{Clock, Self};
    use souv::cap::AdminCap;
    use souv::gatekeeper_helper::verify_platform;
    use souv::gatekeeper_helper::PublicKeys;

    const EEventExpired: u64 = 1;
    const ENotAuthorized: u64 = 2;
    const ESupplyLimitExceeded: u64 = 3;
    const EInvalidSupplyLimit: u64 = 4;

    public struct SOUV1 has drop {}
    public struct SOUV2 has drop {}
    public struct SOUV3 has drop {}
    public struct SOUV4 has drop {}
    public struct SOUV5 has drop {}
    public struct SOUV6 has drop {}

    public struct SupplyCap<phantom T> has key, store {
        id: UID,
        supply_limit: Option<u64>, 
        minted_count: u64,
    }

    public struct Platform<phantom T> has key, store {
        id: UID,
    }

    public struct NonTransferablePlatform<phantom T> has key {
        id: UID,
    }

    public struct RestrictTransferable<phantom T> has key {
        id: UID,
    }

    public struct Event<phantom T> has key, store {
        id: UID,
        expiration: u64,
    }

    public fun create_supply_cap<T>(
        _admin: &AdminCap,
        supply_limit: Option<u64>,
        ctx: &mut TxContext,
    ): SupplyCap<T> {
        SupplyCap<T> {
            id: object::new(ctx),
            supply_limit,
            minted_count: 0,
        }
    }

    public fun new_event<T>(
        duration: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Event<T> {
        Event<T> {
            id: object::new(ctx),
            expiration: clock::timestamp_ms(clock) + duration,
        }
    }

    public fun mint_and_transfer<T: drop>(
        event: &Event<T>,
        supply_cap: &mut SupplyCap<T>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(event.expiration > clock::timestamp_ms(clock), EEventExpired);
        if (option::is_some(&supply_cap.supply_limit)) {
            let limit = option::borrow(&supply_cap.supply_limit);
            assert!(supply_cap.minted_count < *limit, ESupplyLimitExceeded);
        };

        let poap = Platform<T> {
            id: object::new(ctx),
        };
        supply_cap.minted_count = supply_cap.minted_count + 1;
        transfer::public_transfer(poap, recipient);
    }

    public fun mint_non_transferable<T: drop>(
        event: &Event<T>,
        supply_cap: &mut SupplyCap<T>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(event.expiration > clock::timestamp_ms(clock), EEventExpired);
        if (option::is_some(&supply_cap.supply_limit)) {
            let limit = option::borrow(&supply_cap.supply_limit);
            assert!(supply_cap.minted_count < *limit, ESupplyLimitExceeded);
        };

        let poap = NonTransferablePlatform<T> {
            id: object::new(ctx),
        };
        supply_cap.minted_count = supply_cap.minted_count + 1;
        transfer::transfer(poap, recipient);
    }

    public fun mint_restrict_transferable<T: drop>(
        event: &Event<T>,
        supply_cap: &mut SupplyCap<T>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(event.expiration > clock::timestamp_ms(clock), EEventExpired);
        if (option::is_some(&supply_cap.supply_limit)) {
            let limit = option::borrow(&supply_cap.supply_limit);
            assert!(supply_cap.minted_count < *limit, ESupplyLimitExceeded);
        };

        let poap = RestrictTransferable<T> {
            id: object::new(ctx),
        };
        supply_cap.minted_count = supply_cap.minted_count + 1;
        transfer::transfer(poap, recipient);
    }

    public fun update_supply<T>(
        _admin: &AdminCap,
        supply_cap: &mut SupplyCap<T>,
        new_limit: u64,
    ) {
        assert!(option::is_some(&supply_cap.supply_limit), EInvalidSupplyLimit);
        assert!(new_limit >= supply_cap.minted_count, EInvalidSupplyLimit);
        supply_cap.supply_limit = option::some(new_limit);
    }

    public fun is_expired<T>(event: &Event<T>, clock: &Clock): bool {
        event.expiration <= clock::timestamp_ms(clock)
    }

    public fun get_remaining_supply<T>(supply_cap: &SupplyCap<T>): Option<u64> {
        if (option::is_some(&supply_cap.supply_limit)) {
            let limit = option::borrow(&supply_cap.supply_limit);
            option::some(*limit - supply_cap.minted_count)
        } else {
            option::none()
        }
    }

    public fun transfer_restrict_transferable<T: drop>(
        _admin: &AdminCap,
        poap: RestrictTransferable<T>,
        event: &Event<T>,
        recipient: address,
        clock: &Clock,
    ) {
        assert!(event.expiration > clock::timestamp_ms(clock), EEventExpired);
        transfer::transfer(poap, recipient);
    }

    public fun transfer<T>(
        recipient: address,
        nfts: RestrictTransferable<T>,
        signature_wrapper: &mut PublicKeys,
        signed_data: vector<u8>, 
        msg: vector<u8>,
        _ctx: &mut TxContext,
    ) {
        verify_platform(signature_wrapper, signed_data, msg);
        transfer::transfer(nfts, recipient);
    }
}