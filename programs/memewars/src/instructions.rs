use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount, Burn};

use crate::constants::{self, battle_status, team, fees};
use crate::pyth;
use crate::state::*;

// ============================================================================
// CREATE BATTLE
// ============================================================================

/// Tạo một cuộc chiến mới giữa 2 token
pub fn create_battle(
    ctx: Context<CreateBattle>,
    battle_id: u64,
    duration_seconds: i64,
) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let clock = Clock::get()?;
    
    // Validate duration
    require!(
        duration_seconds >= constants::time::MIN_BATTLE_DURATION,
        MemeWarsError::InvalidDuration
    );
    require!(
        duration_seconds <= constants::time::MAX_BATTLE_DURATION,
        MemeWarsError::InvalidDuration
    );
    
    // Get initial prices from Pyth
    let price_a = pyth::get_pyth_price(&ctx.accounts.price_feed_a)?;
    let price_b = pyth::get_pyth_price(&ctx.accounts.price_feed_b)?;
    
    // Derive vault PDAs
    let (vault_a_pda, _) = Pubkey::find_program_address(
        &[
            constants::seeds::VAULT,
            battle_id.to_le_bytes().as_ref(),
            team::TEAM_A.to_le_bytes().as_ref(),
        ],
        ctx.program_id,
    );
    let (vault_b_pda, _) = Pubkey::find_program_address(
        &[
            constants::seeds::VAULT,
            battle_id.to_le_bytes().as_ref(),
            team::TEAM_B.to_le_bytes().as_ref(),
        ],
        ctx.program_id,
    );
    
    // Initialize battle state
    battle.battle_id = battle_id;
    battle.authority = ctx.accounts.authority.key();
    battle.token_a = ctx.accounts.token_a.key();
    battle.token_b = ctx.accounts.token_b.key();
    battle.price_feed_a = ctx.accounts.price_feed_a.key();
    battle.price_feed_b = ctx.accounts.price_feed_b.key();
    battle.initial_price_a = price_a;
    battle.initial_price_b = price_b;
    battle.final_price_a = None;
    battle.final_price_b = None;
    battle.start_time = clock.unix_timestamp;
    battle.end_time = clock.unix_timestamp + duration_seconds;
    battle.total_staked_a = 0;
    battle.total_staked_b = 0;
    battle.status = battle_status::ACTIVE;
    battle.winner = team::NONE;
    battle.vault_a = vault_a_pda;
    battle.vault_b = vault_b_pda;
    battle.total_yield_collected = 0;
    battle.winner_yield = 0;
    battle.protocol_fee_collected = 0;
    battle.bump = ctx.bumps.battle;
    
    msg!(
        "Battle {} created: {} vs {} | Duration: {} seconds | Initial prices: A={}, B={}",
        battle_id,
        ctx.accounts.token_a.key(),
        ctx.accounts.token_b.key(),
        duration_seconds,
        price_a,
        price_b
    );
    
    Ok(())
}

#[derive(Accounts)]
#[instruction(battle_id: u64)]
pub struct CreateBattle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = BattleState::LEN,
        seeds = [constants::seeds::BATTLE, battle_id.to_le_bytes().as_ref()],
        bump
    )]
    pub battle: Account<'info, BattleState>,
    
    /// Token A mint (e.g., BONK)
    /// CHECK: Just storing the pubkey
    pub token_a: UncheckedAccount<'info>,
    
    /// Token B mint (e.g., WIF)
    /// CHECK: Just storing the pubkey
    pub token_b: UncheckedAccount<'info>,
    
    /// Pyth price feed for token A
    /// CHECK: Pyth price feed account
    pub price_feed_a: UncheckedAccount<'info>,
    
    /// Pyth price feed for token B
    /// CHECK: Pyth price feed account
    pub price_feed_b: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

// ============================================================================
// DEPOSIT
// ============================================================================

/// Deposit SOL vào một cuộc chiến
pub fn deposit(ctx: Context<Deposit>, amount: u64, team: u8) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let user_state = &mut ctx.accounts.user_state;
    let vault = &mut ctx.accounts.vault;
    let clock = Clock::get()?;

    // Kiểm tra cuộc chiến đang active
    require!(battle.is_active(), MemeWarsError::BattleNotActive);
    
    // Kiểm tra team hợp lệ
    require!(
        team == constants::team::TEAM_A || team == constants::team::TEAM_B,
        MemeWarsError::InvalidTeam
    );

    // Kiểm tra thời gian còn trong phạm vi cuộc chiến
    require!(
        clock.unix_timestamp >= battle.start_time && clock.unix_timestamp < battle.end_time,
        MemeWarsError::BattleTimeExpired
    );

    // Kiểm tra vault phù hợp với team
    let expected_vault = if team == constants::team::TEAM_A {
        battle.vault_a
    } else {
        battle.vault_b
    };
    require!(
        vault.key() == expected_vault,
        MemeWarsError::InvalidVault
    );

    // Transfer SOL từ user vào vault
    let cpi_context = CpiContext::new(
        ctx.accounts.system_program.to_account_info(),
        anchor_lang::system_program::Transfer {
            from: ctx.accounts.user.to_account_info(),
            to: vault.to_account_info(),
        },
    );
    anchor_lang::system_program::transfer(cpi_context, amount)?;

    // Cập nhật UserState
    if user_state.amount_staked == 0 {
        // Lần đầu stake
        user_state.user = ctx.accounts.user.key();
        user_state.battle_id = battle.battle_id;
        user_state.team = team;
        user_state.amount_staked = amount;
        user_state.stake_time = clock.unix_timestamp;
        user_state.claimed = false;
        user_state.reward_amount = 0;
        user_state.bump = ctx.bumps.user_state;
    } else {
        // Boost: thêm tiền vào stake hiện có
        require!(
            user_state.team == team,
            MemeWarsError::CannotChangeTeam
        );
        user_state.amount_staked = user_state.amount_staked
            .checked_add(amount)
            .ok_or(MemeWarsError::Overflow)?;
    }

    // Khởi tạo Vault nếu mới
    if vault.total_amount == 0 && vault.lent_amount == 0 {
        vault.battle_id = battle.battle_id;
        vault.team = team;
        vault.lending_position = None;
        vault.msol_balance = 0;
        vault.yield_collected = 0;
        vault.claimed_amount = 0;
        vault.bump = ctx.bumps.vault;
    }

    // Cập nhật Vault
    vault.total_amount = vault.total_amount
        .checked_add(amount)
        .ok_or(MemeWarsError::Overflow)?;

    // Cập nhật BattleState
    if team == constants::team::TEAM_A {
        battle.total_staked_a = battle.total_staked_a
            .checked_add(amount)
            .ok_or(MemeWarsError::Overflow)?;
    } else {
        battle.total_staked_b = battle.total_staked_b
            .checked_add(amount)
            .ok_or(MemeWarsError::Overflow)?;
    }

    // Mint ticket token cho người dùng
    let battle_id_bytes = battle.battle_id.to_le_bytes();
    let team_bytes = team.to_le_bytes();
    let seeds = &[
        constants::seeds::TICKET_MINT_AUTHORITY,
        battle_id_bytes.as_ref(),
        team_bytes.as_ref(),
        &[ctx.bumps.ticket_mint_authority],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.ticket_mint.to_account_info(),
        to: ctx.accounts.user_ticket_account.to_account_info(),
        authority: ctx.accounts.ticket_mint_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    token::mint_to(cpi_ctx, amount)?;

    msg!(
        "Deposit: User {} staked {} lamports for team {} in battle {}",
        ctx.accounts.user.key(),
        amount,
        team,
        battle.battle_id
    );

    Ok(())
}

#[derive(Accounts)]
#[instruction(amount: u64, team: u8)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [constants::seeds::BATTLE, battle.battle_id.to_le_bytes().as_ref()],
        bump = battle.bump
    )]
    pub battle: Account<'info, BattleState>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserState::LEN,
        seeds = [constants::seeds::USER_STATE, user.key().as_ref(), battle.battle_id.to_le_bytes().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        init_if_needed,
        payer = user,
        space = Vault::LEN,
        seeds = [constants::seeds::VAULT, battle.battle_id.to_le_bytes().as_ref(), team.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    /// Ticket mint cho battle và team này
    #[account(
        init_if_needed,
        payer = user,
        seeds = [constants::seeds::TICKET_MINT, battle.battle_id.to_le_bytes().as_ref(), team.to_le_bytes().as_ref()],
        bump,
        mint::decimals = 0,
        mint::authority = ticket_mint_authority
    )]
    pub ticket_mint: Account<'info, Mint>,

    /// CHECK: PDA được verify qua seeds
    #[account(
        seeds = [constants::seeds::TICKET_MINT_AUTHORITY, battle.battle_id.to_le_bytes().as_ref(), team.to_le_bytes().as_ref()],
        bump
    )]
    pub ticket_mint_authority: UncheckedAccount<'info>,

    /// Token account của user để nhận ticket
    #[account(
        init_if_needed,
        payer = user,
        token::mint = ticket_mint,
        token::authority = user
    )]
    pub user_ticket_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

// ============================================================================
// SETTLE - Kết thúc battle và xác định winner
// ============================================================================

/// Settle battle - lấy giá cuối cùng từ Pyth và xác định winner
pub fn settle(ctx: Context<SettleBattle>) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let vault_a = &mut ctx.accounts.vault_a;
    let vault_b = &mut ctx.accounts.vault_b;
    let clock = Clock::get()?;
    
    // Kiểm tra battle đang active
    require!(battle.is_active(), MemeWarsError::BattleNotActive);
    
    // Kiểm tra đã đến thời gian kết thúc
    require!(
        battle.is_ended(clock.unix_timestamp),
        MemeWarsError::BattleNotEnded
    );
    
    // Lấy giá cuối cùng từ Pyth Oracle
    let final_price_a = pyth::get_pyth_price(&ctx.accounts.price_feed_a)?;
    let final_price_b = pyth::get_pyth_price(&ctx.accounts.price_feed_b)?;
    
    // Cập nhật final prices
    battle.final_price_a = Some(final_price_a);
    battle.final_price_b = Some(final_price_b);
    
    // Tính % growth
    let growth_a = BattleState::calculate_growth_bps(battle.initial_price_a, final_price_a);
    let growth_b = BattleState::calculate_growth_bps(battle.initial_price_b, final_price_b);
    
    // Xác định winner
    let winner = if growth_a > growth_b {
        team::TEAM_A
    } else if growth_b > growth_a {
        team::TEAM_B
    } else {
        team::NONE // Tie
    };
    
    battle.winner = winner;
    battle.status = battle_status::SETTLED;
    
    // Tính yield từ lending
    // Trong implementation thực tế, sẽ rút từ Marinade và tính yield
    // Ở đây giả định yield = 0.1% của total staked (cho demo)
    let total_staked = battle.total_staked_a.saturating_add(battle.total_staked_b);
    let simulated_yield = total_staked / 1000; // 0.1% yield for demo
    
    // Tính protocol fee (5%)
    let protocol_fee = simulated_yield
        .checked_mul(fees::PROTOCOL_FEE_BPS)
        .ok_or(MemeWarsError::Overflow)?
        .checked_div(fees::BPS_DIVISOR)
        .ok_or(MemeWarsError::Overflow)?;
    
    let winner_yield = simulated_yield.saturating_sub(protocol_fee);
    
    battle.total_yield_collected = simulated_yield;
    battle.winner_yield = winner_yield;
    battle.protocol_fee_collected = protocol_fee;
    
    // Update vault yield info
    let yield_a = if winner == team::TEAM_A {
        winner_yield
    } else if winner == team::NONE {
        // Tie: split proportionally
        winner_yield.checked_mul(battle.total_staked_a)
            .ok_or(MemeWarsError::Overflow)?
            .checked_div(total_staked.max(1))
            .ok_or(MemeWarsError::Overflow)?
    } else {
        0
    };
    
    let yield_b = winner_yield.saturating_sub(yield_a);
    
    vault_a.yield_collected = yield_a;
    vault_b.yield_collected = yield_b;
    
    msg!(
        "Battle {} settled: Winner={} | Growth A={} bps, B={} bps | Yield A={}, B={}",
        battle.battle_id,
        winner,
        growth_a,
        growth_b,
        yield_a,
        yield_b
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct SettleBattle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [constants::seeds::BATTLE, battle.battle_id.to_le_bytes().as_ref()],
        bump = battle.bump,
        constraint = battle.authority == authority.key() @ MemeWarsError::Unauthorized
    )]
    pub battle: Account<'info, BattleState>,
    
    #[account(
        mut,
        seeds = [constants::seeds::VAULT, battle.battle_id.to_le_bytes().as_ref(), team::TEAM_A.to_le_bytes().as_ref()],
        bump = vault_a.bump
    )]
    pub vault_a: Account<'info, Vault>,
    
    #[account(
        mut,
        seeds = [constants::seeds::VAULT, battle.battle_id.to_le_bytes().as_ref(), team::TEAM_B.to_le_bytes().as_ref()],
        bump = vault_b.bump
    )]
    pub vault_b: Account<'info, Vault>,
    
    /// Pyth price feed for token A
    /// CHECK: Pyth price feed account
    pub price_feed_a: UncheckedAccount<'info>,
    
    /// Pyth price feed for token B
    /// CHECK: Pyth price feed account
    pub price_feed_b: UncheckedAccount<'info>,
}

// ============================================================================
// CLAIM REWARD - Người chơi nhận thưởng sau khi battle kết thúc
// ============================================================================

/// Claim reward sau khi battle đã settle
/// - Winner: nhận principal + yield
/// - Loser: nhận principal only
pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
    let battle = &ctx.accounts.battle;
    let user_state = &mut ctx.accounts.user_state;
    let vault = &mut ctx.accounts.vault;
    
    // Kiểm tra battle đã settle
    require!(battle.is_settled(), MemeWarsError::BattleNotSettled);
    
    // Kiểm tra chưa claim
    require!(!user_state.claimed, MemeWarsError::AlreadyClaimed);
    
    // Kiểm tra user_state thuộc về vault đúng
    require!(user_state.team == vault.team, MemeWarsError::InvalidVault);
    
    // Tính số tiền claim
    let claim_amount = user_state.calculate_claim_amount(battle);
    
    // Kiểm tra vault có đủ tiền
    let vault_balance = vault.to_account_info().lamports();
    require!(vault_balance >= claim_amount, MemeWarsError::InsufficientFunds);
    
    // Transfer SOL từ vault cho user
    **vault.to_account_info().try_borrow_mut_lamports()? -= claim_amount;
    **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += claim_amount;
    
    // Update states
    user_state.claimed = true;
    user_state.reward_amount = claim_amount.saturating_sub(user_state.amount_staked);
    vault.claimed_amount = vault.claimed_amount.saturating_add(claim_amount);
    
    // Burn ticket tokens
    let user_ticket_balance = ctx.accounts.user_ticket_account.amount;
    if user_ticket_balance > 0 {
        let cpi_accounts = Burn {
            mint: ctx.accounts.ticket_mint.to_account_info(),
            from: ctx.accounts.user_ticket_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, user_ticket_balance)?;
    }
    
    msg!(
        "Claim: User {} claimed {} lamports (principal: {}, reward: {}) from battle {}",
        ctx.accounts.user.key(),
        claim_amount,
        user_state.amount_staked,
        user_state.reward_amount,
        battle.battle_id
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct ClaimReward<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        seeds = [constants::seeds::BATTLE, battle.battle_id.to_le_bytes().as_ref()],
        bump = battle.bump
    )]
    pub battle: Account<'info, BattleState>,
    
    #[account(
        mut,
        seeds = [constants::seeds::USER_STATE, user.key().as_ref(), battle.battle_id.to_le_bytes().as_ref()],
        bump = user_state.bump,
        constraint = user_state.user == user.key() @ MemeWarsError::Unauthorized
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(
        mut,
        seeds = [constants::seeds::VAULT, battle.battle_id.to_le_bytes().as_ref(), user_state.team.to_le_bytes().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        mut,
        seeds = [constants::seeds::TICKET_MINT, battle.battle_id.to_le_bytes().as_ref(), user_state.team.to_le_bytes().as_ref()],
        bump
    )]
    pub ticket_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        token::mint = ticket_mint,
        token::authority = user
    )]
    pub user_ticket_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// ============================================================================
// WITHDRAW - Rút sớm (có phạt) hoặc rút khi battle bị hủy
// ============================================================================

/// Withdraw - rút sớm trước khi battle kết thúc
/// Có penalty 1% nếu rút sớm
pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
    let battle = &mut ctx.accounts.battle;
    let user_state = &mut ctx.accounts.user_state;
    let vault = &mut ctx.accounts.vault;
    
    // Kiểm tra chưa claim
    require!(!user_state.claimed, MemeWarsError::AlreadyClaimed);
    
    // Tính số tiền rút
    let mut withdraw_amount = user_state.amount_staked;
    
    // Nếu battle đang active (rút sớm) -> áp dụng penalty
    if battle.is_active() {
        let penalty = withdraw_amount
            .checked_mul(fees::EARLY_WITHDRAWAL_PENALTY_BPS)
            .ok_or(MemeWarsError::Overflow)?
            .checked_div(fees::BPS_DIVISOR)
            .ok_or(MemeWarsError::Overflow)?;
        
        withdraw_amount = withdraw_amount.saturating_sub(penalty);
        
        msg!("Early withdrawal penalty: {} lamports", penalty);
    }
    
    // Kiểm tra vault có đủ tiền
    let vault_balance = vault.to_account_info().lamports();
    require!(vault_balance >= withdraw_amount, MemeWarsError::InsufficientFunds);
    
    // Transfer SOL từ vault cho user
    **vault.to_account_info().try_borrow_mut_lamports()? -= withdraw_amount;
    **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? += withdraw_amount;
    
    // Update battle totals
    if user_state.team == team::TEAM_A {
        battle.total_staked_a = battle.total_staked_a.saturating_sub(user_state.amount_staked);
    } else {
        battle.total_staked_b = battle.total_staked_b.saturating_sub(user_state.amount_staked);
    }
    
    // Update vault
    vault.total_amount = vault.total_amount.saturating_sub(user_state.amount_staked);
    
    // Mark as claimed
    user_state.claimed = true;
    user_state.reward_amount = 0;
    
    // Burn ticket tokens
    let user_ticket_balance = ctx.accounts.user_ticket_account.amount;
    if user_ticket_balance > 0 {
        let cpi_accounts = Burn {
            mint: ctx.accounts.ticket_mint.to_account_info(),
            from: ctx.accounts.user_ticket_account.to_account_info(),
            authority: ctx.accounts.user.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::burn(cpi_ctx, user_ticket_balance)?;
    }
    
    msg!(
        "Withdraw: User {} withdrew {} lamports from battle {}",
        ctx.accounts.user.key(),
        withdraw_amount,
        battle.battle_id
    );
    
    Ok(())
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        seeds = [constants::seeds::BATTLE, battle.battle_id.to_le_bytes().as_ref()],
        bump = battle.bump
    )]
    pub battle: Account<'info, BattleState>,
    
    #[account(
        mut,
        seeds = [constants::seeds::USER_STATE, user.key().as_ref(), battle.battle_id.to_le_bytes().as_ref()],
        bump = user_state.bump,
        constraint = user_state.user == user.key() @ MemeWarsError::Unauthorized
    )]
    pub user_state: Account<'info, UserState>,
    
    #[account(
        mut,
        seeds = [constants::seeds::VAULT, battle.battle_id.to_le_bytes().as_ref(), user_state.team.to_le_bytes().as_ref()],
        bump = vault.bump
    )]
    pub vault: Account<'info, Vault>,
    
    #[account(
        mut,
        seeds = [constants::seeds::TICKET_MINT, battle.battle_id.to_le_bytes().as_ref(), user_state.team.to_le_bytes().as_ref()],
        bump
    )]
    pub ticket_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        token::mint = ticket_mint,
        token::authority = user
    )]
    pub user_ticket_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// Helper functions are now in pyth.rs module

// ============================================================================
// ERROR CODES
// ============================================================================

#[error_code]
pub enum MemeWarsError {
    #[msg("Battle is not active")]
    BattleNotActive,
    
    #[msg("Invalid team selected")]
    InvalidTeam,
    
    #[msg("Battle time has expired")]
    BattleTimeExpired,
    
    #[msg("Invalid vault for this team")]
    InvalidVault,
    
    #[msg("Arithmetic overflow")]
    Overflow,
    
    #[msg("Battle has not ended yet")]
    BattleNotEnded,
    
    #[msg("Battle has not been settled yet")]
    BattleNotSettled,
    
    #[msg("Already claimed")]
    AlreadyClaimed,
    
    #[msg("Insufficient funds in vault")]
    InsufficientFunds,
    
    #[msg("Unauthorized")]
    Unauthorized,
    
    #[msg("Invalid battle duration")]
    InvalidDuration,
    
    #[msg("Price feed is stale")]
    StalePriceFeed,
    
    #[msg("Cannot change team after staking")]
    CannotChangeTeam,
    
    #[msg("Invalid Pyth price feed account")]
    InvalidPriceFeed,
    
    #[msg("Price confidence too low")]
    LowPriceConfidence,
}
