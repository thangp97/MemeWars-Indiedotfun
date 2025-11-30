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

