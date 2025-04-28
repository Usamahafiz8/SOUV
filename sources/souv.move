module souv::souv {
    use sui::package;

    use souv::cap;
    public struct SOUV has drop {}

    #[allow(lint(share_owned))]
    fun init(otw: SOUV, ctx: &mut TxContext) {
        let publisher = package::claim(otw, ctx);
            let admin_cap = cap::new(ctx);
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_transfer(publisher, ctx.sender());
    }

}