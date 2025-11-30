use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

/// BattleState: Lưu thông tin về một cuộc chiến giữa 2 token
#[account]
pub struct BattleState {
    /// ID duy nhất của cuộc chiến
    pub battle_id: u64,
    
    /// Mint address của token phe 1 (ví dụ: $BONK)
    pub token_a: Pubkey,
    
    /// Mint address của token phe 2 (ví dụ: $WIF)
    pub token_b: Pubkey,
    
    /// Giá ban đầu của token A (từ oracle)
    pub initial_price_a: u64,
    
    /// Giá ban đầu của token B (từ oracle)
    pub initial_price_b: u64,
    
    /// Giá cuối cùng của token A (từ oracle khi kết thúc)
    pub final_price_a: Option<u64>,
    
    /// Giá cuối cùng của token B (từ oracle khi kết thúc)
    pub final_price_b: Option<u64>,
    
    /// Thời gian bắt đầu cuộc chiến (Unix timestamp)
    pub start_time: i64,
    
    /// Thời gian kết thúc cuộc chiến (Unix timestamp)
    pub end_time: i64,
    
    /// Tổng tài sản đã stake của phe A (lamports)
    pub total_staked_a: u64,
    
    /// Tổng tài sản đã stake của phe B (lamports)
    pub total_staked_b: u64,
    
    /// Trạng thái cuộc chiến: 0 = Active, 1 = Settled, 2 = Cancelled
    pub status: u8,
    
    /// Phe thắng: 0 = None, 1 = Team A, 2 = Team B
    pub winner: u8,
    
    /// Vault PDA cho phe A (để quản lý tài sản)
    pub vault_a: Pubkey,
    
    /// Vault PDA cho phe B (để quản lý tài sản)
    pub vault_b: Pubkey,
    
    /// Bump seed cho PDA
    pub bump: u8,
}

impl BattleState {
    pub const LEN: usize = 8 + // discriminator
        8 + // battle_id
        32 + // token_a
        32 + // token_b
        8 + // initial_price_a
        8 + // initial_price_b
        1 + 8 + // Option<u64> for final_price_a
        1 + 8 + // Option<u64> for final_price_b
        8 + // start_time
        8 + // end_time
        8 + // total_staked_a
        8 + // total_staked_b
        1 + // status
        1 + // winner
        32 + // vault_a
        32 + // vault_b
        1; // bump
    
    /// Kiểm tra xem cuộc chiến có đang active không
    pub fn is_active(&self) -> bool {
        self.status == 0
    }
    
    /// Kiểm tra xem cuộc chiến đã được settle chưa
    pub fn is_settled(&self) -> bool {
        self.status == 1
    }
}

/// UserState: Lưu thông tin về người chơi trong một cuộc chiến
#[account]
pub struct UserState {
    /// Người chơi (wallet address)
    pub user: Pubkey,
    
    /// ID của cuộc chiến mà người chơi tham gia
    pub battle_id: u64,
    
    /// Phe mà người chơi chọn: 1 = Team A, 2 = Team B
    pub team: u8,
    
    /// Số tiền đã stake (lamports)
    pub amount_staked: u64,
    
    /// Thời gian stake (Unix timestamp)
    pub stake_time: i64,
    
    /// Đã claim thưởng chưa: false = chưa, true = rồi
    pub claimed: bool,
    
    /// Bump seed cho PDA
    pub bump: u8,
}

impl UserState {
    pub const LEN: usize = 8 + // discriminator
        32 + // user
        8 + // battle_id
        1 + // team
        8 + // amount_staked
        8 + // stake_time
        1 + // claimed
        1; // bump
}

/// Vault: Quản lý tài sản của một phe trong cuộc chiến
#[account]
pub struct Vault {
    /// ID của cuộc chiến
    pub battle_id: u64,
    
    /// Phe: 1 = Team A, 2 = Team B
    pub team: u8,
    
    /// Tổng số tiền trong vault (lamports)
    pub total_amount: u64,
    
    /// Số tiền đã được gửi vào lending protocol (lamports)
    pub lent_amount: u64,
    
    /// Address của lending position (nếu có)
    pub lending_position: Option<Pubkey>,
    
    /// Bump seed cho PDA
    pub bump: u8,
}

impl Vault {
    pub const LEN: usize = 8 + // discriminator
        8 + // battle_id
        1 + // team
        8 + // total_amount
        8 + // lent_amount
        1 + 32 + // Option<Pubkey> for lending_position
        1; // bump
    
    /// Kiểm tra xem vault có còn tiền chưa cho vay không
    pub fn has_available_funds(&self) -> bool {
        self.total_amount > self.lent_amount
    }
    
    /// Số tiền còn lại chưa cho vay
    pub fn available_funds(&self) -> u64 {
        self.total_amount.saturating_sub(self.lent_amount)
    }
}

