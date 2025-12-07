use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey::Pubkey;

/// BattleState: Lưu thông tin về một cuộc chiến giữa 2 token
#[account]
pub struct BattleState {
    /// ID duy nhất của cuộc chiến
    pub battle_id: u64,
    
    /// Authority có quyền settle battle (thường là admin hoặc keeper)
    pub authority: Pubkey,
    
    /// Mint address của token phe 1 (ví dụ: $BONK)
    pub token_a: Pubkey,
    
    /// Mint address của token phe 2 (ví dụ: $WIF)
    pub token_b: Pubkey,
    
    /// Pyth price feed ID cho token A
    pub price_feed_a: Pubkey,
    
    /// Pyth price feed ID cho token B
    pub price_feed_b: Pubkey,
    
    /// Giá ban đầu của token A (scaled by 10^8)
    pub initial_price_a: i64,
    
    /// Giá ban đầu của token B (scaled by 10^8)
    pub initial_price_b: i64,
    
    /// Giá cuối cùng của token A (scaled by 10^8)
    pub final_price_a: Option<i64>,
    
    /// Giá cuối cùng của token B (scaled by 10^8)
    pub final_price_b: Option<i64>,
    
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
    
    /// Tổng yield đã thu được từ lending (sau khi settle)
    pub total_yield_collected: u64,
    
    /// Tổng yield cho team thắng (sau khi trừ protocol fee)
    pub winner_yield: u64,
    
    /// Protocol fee đã thu (5% của total yield)
    pub protocol_fee_collected: u64,
    
    /// Bump seed cho PDA
    pub bump: u8,
}

impl BattleState {
    pub const LEN: usize = 8 + // discriminator
        8 + // battle_id
        32 + // authority
        32 + // token_a
        32 + // token_b
        32 + // price_feed_a
        32 + // price_feed_b
        8 + // initial_price_a
        8 + // initial_price_b
        1 + 8 + // Option<i64> for final_price_a
        1 + 8 + // Option<i64> for final_price_b
        8 + // start_time
        8 + // end_time
        8 + // total_staked_a
        8 + // total_staked_b
        1 + // status
        1 + // winner
        32 + // vault_a
        32 + // vault_b
        8 + // total_yield_collected
        8 + // winner_yield
        8 + // protocol_fee_collected
        1; // bump
    
    /// Kiểm tra xem cuộc chiến có đang active không
    pub fn is_active(&self) -> bool {
        self.status == 0
    }
    
    /// Kiểm tra xem cuộc chiến đã được settle chưa
    pub fn is_settled(&self) -> bool {
        self.status == 1
    }
    
    /// Kiểm tra xem đã đến thời gian kết thúc chưa
    pub fn is_ended(&self, current_time: i64) -> bool {
        current_time >= self.end_time
    }
    
    /// Tính % tăng trưởng của một token
    /// Returns basis points (100% = 10000)
    pub fn calculate_growth_bps(initial_price: i64, final_price: i64) -> i64 {
        if initial_price == 0 {
            return 0;
        }
        // (final - initial) / initial * 10000
        ((final_price - initial_price) * 10_000) / initial_price
    }
    
    /// Xác định winner dựa trên % tăng trưởng
    pub fn determine_winner(&self) -> u8 {
        match (self.final_price_a, self.final_price_b) {
            (Some(final_a), Some(final_b)) => {
                let growth_a = Self::calculate_growth_bps(self.initial_price_a, final_a);
                let growth_b = Self::calculate_growth_bps(self.initial_price_b, final_b);
                
                if growth_a > growth_b {
                    crate::constants::team::TEAM_A
                } else if growth_b > growth_a {
                    crate::constants::team::TEAM_B
                } else {
                    // Tie - return to both sides proportionally
                    crate::constants::team::NONE
                }
            }
            _ => crate::constants::team::NONE,
        }
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
    
    /// Số tiền thưởng được nhận (tính sau khi settle)
    pub reward_amount: u64,
    
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
        8 + // reward_amount
        1; // bump
    
    /// Tính số tiền user nhận được dựa trên kết quả battle
    /// 
    /// Logic:
    /// - Winner: principal + (user_stake / total_winner_stake) * winner_yield
    /// - Loser: principal only
    /// - Tie: principal + proportional yield
    pub fn calculate_claim_amount(
        &self,
        battle: &BattleState,
    ) -> u64 {
        let is_winner = self.team == battle.winner;
        let is_tie = battle.winner == crate::constants::team::NONE;
        
        if is_tie {
            // Tie: trả lại principal + phần yield tỷ lệ
            let total_staked = battle.total_staked_a.saturating_add(battle.total_staked_b);
            if total_staked == 0 {
                return self.amount_staked;
            }
            
            let user_yield = (battle.winner_yield as u128)
                .saturating_mul(self.amount_staked as u128)
                .checked_div(total_staked as u128)
                .unwrap_or(0) as u64;
            
            self.amount_staked.saturating_add(user_yield)
        } else if is_winner {
            // Winner: principal + phần yield tỷ lệ
            let total_winner_stake = if self.team == crate::constants::team::TEAM_A {
                battle.total_staked_a
            } else {
                battle.total_staked_b
            };
            
            if total_winner_stake == 0 {
                return self.amount_staked;
            }
            
            let user_yield = (battle.winner_yield as u128)
                .saturating_mul(self.amount_staked as u128)
                .checked_div(total_winner_stake as u128)
                .unwrap_or(0) as u64;
            
            self.amount_staked.saturating_add(user_yield)
        } else {
            // Loser: chỉ principal
            self.amount_staked
        }
    }
}

/// Vault: Quản lý tài sản của một phe trong cuộc chiến
/// 
/// Reward Distribution Logic:
/// - Team thắng: Nhận vốn gốc + lãi của mình + TOÀN BỘ lãi của team thua
/// - Team thua: Chỉ nhận vốn gốc (không có lãi, vì lãi đã chuyển cho team thắng)
#[account]
pub struct Vault {
    /// ID của cuộc chiến
    pub battle_id: u64,
    
    /// Phe: 1 = Team A, 2 = Team B
    pub team: u8,
    
    /// Tổng số tiền trong vault (lamports) - vốn gốc đã stake
    pub total_amount: u64,
    
    /// Số tiền đã được gửi vào lending protocol (lamports)
    pub lent_amount: u64,
    
    /// Address của lending position (mSOL token account)
    pub lending_position: Option<Pubkey>,
    
    /// Số mSOL đã nhận được từ lending
    pub msol_balance: u64,
    
    /// Yield thu được sau khi rút từ lending (lamports)
    pub yield_collected: u64,
    
    /// Số tiền đã được claim bởi users
    pub claimed_amount: u64,
    
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
        8 + // msol_balance
        8 + // yield_collected
        8 + // claimed_amount
        1; // bump
    
    /// Kiểm tra xem vault có còn tiền chưa cho vay không
    pub fn has_available_funds(&self) -> bool {
        self.total_amount > self.lent_amount
    }
    
    /// Số tiền còn lại chưa cho vay
    pub fn available_funds(&self) -> u64 {
        self.total_amount.saturating_sub(self.lent_amount)
    }
    
    /// Tổng số tiền có thể claim (principal + yield nếu là winner)
    pub fn claimable_amount(&self) -> u64 {
        self.total_amount
            .saturating_add(self.yield_collected)
            .saturating_sub(self.claimed_amount)
    }
}

/// ProtocolState: Lưu thông tin global của protocol
#[account]
pub struct ProtocolState {
    /// Authority có quyền admin
    pub authority: Pubkey,
    
    /// Treasury để nhận protocol fees
    pub treasury: Pubkey,
    
    /// Tổng số battles đã tạo
    pub total_battles: u64,
    
    /// Tổng TVL hiện tại
    pub total_tvl: u64,
    
    /// Tổng fees đã thu
    pub total_fees_collected: u64,
    
    /// Bump seed
    pub bump: u8,
}

impl ProtocolState {
    pub const LEN: usize = 8 + // discriminator
        32 + // authority
        32 + // treasury
        8 + // total_battles
        8 + // total_tvl
        8 + // total_fees_collected
        1; // bump
}
