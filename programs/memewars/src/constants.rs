/// Trạng thái của cuộc chiến
pub mod battle_status {
    pub const ACTIVE: u8 = 0;
    pub const SETTLED: u8 = 1;
    pub const CANCELLED: u8 = 2;
}

/// Phe trong cuộc chiến
pub mod team {
    pub const NONE: u8 = 0;
    pub const TEAM_A: u8 = 1;
    pub const TEAM_B: u8 = 2;
}

/// Pyth Oracle Price Feed IDs (Mainnet)
/// Tham khảo: https://pyth.network/price-feeds
pub mod pyth {
    
    /// SOL/USD Price Feed ID
    pub const SOL_USD_PRICE_FEED: &str = "H6ARHf6YXhGYeQfUzQNGk6rDNnLBQKrenN712K4AQJEG";
    
    /// BONK/USD Price Feed ID  
    pub const BONK_USD_PRICE_FEED: &str = "8ihFLu5FimgTQ1Unh4dVyEHUGodJ5gJQCrQf4KUVB9bN";
    
    /// WIF/USD Price Feed ID
    pub const WIF_USD_PRICE_FEED: &str = "6ABgrEZk8urs6kJ1JNdC1sspH5zKXRqxy8sg3ZG2cQps";
    
    /// POPCAT/USD Price Feed ID
    pub const POPCAT_USD_PRICE_FEED: &str = "5SLwNNEXzgUJ4qjNYFKYxVKJVdrmMPdrP3sxyAj8UHbJ";
    
    /// Maximum staleness for price feeds (in seconds)
    /// Giá cũ hơn 60 giây sẽ không được chấp nhận
    pub const MAX_PRICE_AGE_SECONDS: u64 = 60;
    
    /// Confidence ratio threshold (5% = 500 basis points)
    /// Nếu confidence interval > 5% của price thì reject
    pub const MAX_CONFIDENCE_RATIO_BPS: u64 = 500;
}

/// Protocol fee settings
pub mod fees {
    /// Protocol fee trên yield (5% = 500 basis points)
    /// Phí này được trừ từ tổng yield trước khi chia cho winners
    pub const PROTOCOL_FEE_BPS: u64 = 500;
    
    /// Basis points divisor
    pub const BPS_DIVISOR: u64 = 10_000;
    
    /// Early withdrawal penalty (1% = 100 basis points)
    /// Phạt nếu rút sớm trước khi battle kết thúc
    pub const EARLY_WITHDRAWAL_PENALTY_BPS: u64 = 100;
}

/// Time constants
pub mod time {
    /// Minimum battle duration (1 day in seconds)
    pub const MIN_BATTLE_DURATION: i64 = 86_400;
    
    /// Maximum battle duration (30 days in seconds)
    pub const MAX_BATTLE_DURATION: i64 = 2_592_000;
    
    /// Grace period after battle ends for settlement (1 hour)
    pub const SETTLEMENT_GRACE_PERIOD: i64 = 3_600;
}

/// Lending protocol addresses (Mainnet)
pub mod marinade {
    /// Marinade Program ID
    pub const PROGRAM_ID: &str = "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD";
    
    /// Marinade State Account
    pub const STATE: &str = "8szGkuLTAux9XMgZ2vtY39jVSowEcpBfFfD8hXSEqdGC";
    
    /// mSOL Mint
    pub const MSOL_MINT: &str = "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So";
    
    /// Liquidity Pool SOL Leg
    pub const LIQ_POOL_SOL: &str = "UefNb6z6yvArqe4cJHTXCqStRsKmWhGxnZzuHbikP5Q";
    
    /// Liquidity Pool mSOL Leg
    pub const LIQ_POOL_MSOL: &str = "7GgPYjS5Dza89wV6FpZ23kUJRG5vbQ1GM25ezspYFSoE";
    
    /// Liquidity Pool Authority
    pub const LIQ_POOL_AUTHORITY: &str = "EyaSjUtSgo9aRD1f8LWXwdvkpDTmXAW54yoSHZRF14WL";
    
    /// Reserve
    pub const RESERVE: &str = "Du3Ysj1wKbxPKkuPPnvzQLQh8oMSVifs3jGZjJWXFmHN";
    
    /// mSOL Mint Authority
    pub const MSOL_MINT_AUTHORITY: &str = "3JLPCS1qM2zRw3Dp6V4hZnYHd4toMNPkNesXdX9tg6KM";
}

/// Seed prefixes for PDAs
pub mod seeds {
    pub const BATTLE: &[u8] = b"battle";
    pub const USER_STATE: &[u8] = b"user_state";
    pub const VAULT: &[u8] = b"vault";
    pub const TICKET_MINT: &[u8] = b"ticket_mint";
    pub const TICKET_MINT_AUTHORITY: &[u8] = b"ticket_mint_authority";
    pub const PROTOCOL_TREASURY: &[u8] = b"protocol_treasury";
}
