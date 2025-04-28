module souv::souv_public {
    use sui::clock::{Clock, Self};    
    use sui::table::{Self, Table};
    use souv::cap::AdminCap;
    use souv::counter_v2::{Self, Counter};

    const ERROR_EVENT_EXPIRED: u64 = 1;
    const ERROR_SUPPLY_LIMIT_EXCEEDED: u64 = 3;
    const ERROR_INVALID_SUPPLY_LIMIT: u64 = 4;
    const ERROR_USER_CLAIM_LIMIT_EXCEEDED: u64 = 5;

    public struct SOUV1 has drop {}
    public struct SOUV2 has drop {}
    public struct SOUV3 has drop {}
    public struct SOUV4 has drop {}
    public struct SOUV5 has drop {}
    public struct SOUV6 has drop {}

    public struct SOUV<phantom T> has key, store {
        id: UID,
        supply_limit: Option<u64>,
        max_claims_per_user: u64,
        claims: Table<address, u64>,
        counter: Counter,
    }

    public struct Public<phantom T> has key, store {
        id: UID,
    }

    public struct Event<phantom T> has key, store {
        id: UID,
        expiration: u64,
    }


    public fun create_event<T>(
        duration: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ): Event<T> {
        Event<T> {
            id: object::new(ctx),
            expiration: clock::timestamp_ms(clock) + duration,
        }
    }

    public fun mint_and__transfer<T: drop>(
        event: &Event<T>,
        supply_cap: &mut SOUV<T>,
        recipient: address,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        assert!(event.expiration > clock::timestamp_ms(clock), ERROR_EVENT_EXPIRED);
        let minted = counter_v2::num_minted<T>(&supply_cap.counter);
        if (option::is_some(&supply_cap.supply_limit)) {
            let limit = *option::borrow(&supply_cap.supply_limit);
            assert!(minted < limit, ERROR_SUPPLY_LIMIT_EXCEEDED);
        };

        // Check user claim limit
        let current_claims = if (table::contains(&supply_cap.claims, recipient)) {
            *table::borrow(&supply_cap.claims, recipient)
        } else {
            0
        };
        assert!(current_claims < supply_cap.max_claims_per_user, ERROR_USER_CLAIM_LIMIT_EXCEEDED);

        // Update user claims
        if (table::contains(&supply_cap.claims, recipient)) {
            let claim_count = table::borrow_mut(&mut supply_cap.claims, recipient);
            *claim_count = *claim_count + 1;
        } else {
            table::add(&mut supply_cap.claims, recipient, 1);
        };

        // Update total mints
        counter_v2::incr_mint<T>(&mut supply_cap.counter);

        let souv = Public<T> {
            id: object::new(ctx),
        };
        transfer::public_transfer(souv, recipient);
    }


    public fun update_supply<T>(
        _admin: &AdminCap,
        supply_cap: &mut SOUV<T>,
        new_limit: u64,
    ) {
        assert!(option::is_some(&supply_cap.supply_limit), ERROR_INVALID_SUPPLY_LIMIT);
        let minted = counter_v2::num_minted<T>(&supply_cap.counter);
        assert!(new_limit >= minted, ERROR_INVALID_SUPPLY_LIMIT);
        supply_cap.supply_limit = option::some(new_limit);
    }

    public fun create_supply<T>(
        _admin: &AdminCap,
        supply_limit: Option<u64>,
        max_claims_per_user: u64,
        ctx: &mut TxContext,
    ): SOUV<T> {
        let mut counter = counter_v2::new_counter(ctx);
        counter_v2::add_mint_field<T>(&mut counter);
        SOUV<T> {
            id: object::new(ctx),
            supply_limit,
            max_claims_per_user,
            claims: table::new(ctx),
            counter,
        }
    }
    public fun set_max_claims<T>(
        _admin: &AdminCap,
        supply_cap: &mut SOUV<T>,
        new_max_claims: u64,
    ) {
        supply_cap.max_claims_per_user = new_max_claims;
    }

    public fun is_expired<T>(event: &Event<T>, clock: &Clock): bool {
        event.expiration <= clock::timestamp_ms(clock)
    }
    }