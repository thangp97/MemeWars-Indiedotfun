use anchor_lang::prelude::*;

pub mod constants;
pub mod instructions;
pub mod lending;
pub mod pyth;
pub mod state;

use instructions::*;

declare_id!("71r5LdZhJUpLaNJvCeSxmRqzNmcJuiM8XQ7U8AQdKHGB");

#[program]
pub mod memewars {
    use super::*;

    /// Initialize the protocol (optional, for future admin features)
    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("MemeWars program initialized");
        Ok(())
    }

    /// Tạo một cuộc chiến mới giữa 2 token
    /// 
    /// # Arguments
    /// * `battle_id` - ID duy nhất của cuộc chiến
    /// * `duration_seconds` - Thời gian diễn ra cuộc chiến (1-30 ngày)
    /// 
    /// # Accounts required
    /// * `authority` - Người tạo battle (signer, payer)
    /// * `battle` - PDA lưu thông tin battle
    /// * `token_a` - Mint address của token phe A
    /// * `token_b` - Mint address của token phe B  
    /// * `price_feed_a` - Pyth price feed cho token A
    /// * `price_feed_b` - Pyth price feed cho token B
    pub fn create_battle(
        ctx: Context<CreateBattle>,
        battle_id: u64,
        duration_seconds: i64,
    ) -> Result<()> {
        instructions::create_battle(ctx, battle_id, duration_seconds)
    }

    /// Deposit SOL vào một cuộc chiến và nhận ticket token
    /// 
    /// # Arguments
    /// * `amount` - Số lamports muốn stake
    /// * `team` - Phe muốn tham gia (1 = Team A, 2 = Team B)
    /// 
    /// # Logic
    /// 1. Transfer SOL từ user vào vault
    /// 2. Mint ticket token cho user
    /// 3. Cập nhật user state và battle state
    pub fn deposit(ctx: Context<Deposit>, amount: u64, team: u8) -> Result<()> {
        instructions::deposit(ctx, amount, team)
    }

    /// Settle battle - kết thúc cuộc chiến và xác định winner
    /// 
    /// # Logic
    /// 1. Lấy giá cuối cùng từ Pyth Oracle
    /// 2. Tính % tăng trưởng của mỗi token
    /// 3. Xác định winner (token có % growth cao hơn)
    /// 4. Tính và phân bổ yield cho winners
    /// 5. Thu protocol fee (5%)
    /// 
    /// # Requirements
    /// - Battle phải đang active
    /// - Thời gian hiện tại >= end_time
    /// - Chỉ authority mới có thể settle
    pub fn settle(ctx: Context<SettleBattle>) -> Result<()> {
        instructions::settle(ctx)
    }

    /// Claim reward sau khi battle đã settle
    /// 
    /// # Logic
    /// - Winner: nhận principal + yield tỷ lệ với stake của họ
    /// - Loser: nhận principal only (không mất vốn)
    /// - Tie: cả 2 nhận principal + yield tỷ lệ
    /// 
    /// # Requirements
    /// - Battle phải đã settle
    /// - User chưa claim
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        instructions::claim_reward(ctx)
    }

    /// Withdraw - rút sớm trước khi battle kết thúc
    /// 
    /// # Logic
    /// - Nếu battle đang active: áp dụng penalty 1%
    /// - Nếu battle bị cancelled: rút full amount
    /// 
    /// # Requirements
    /// - User chưa claim/withdraw
    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        instructions::withdraw(ctx)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
