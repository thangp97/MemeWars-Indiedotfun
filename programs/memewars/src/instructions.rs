use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::constants;
use crate::state::*;

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
    **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? += amount;
    **ctx.accounts.user.to_account_info().try_borrow_mut_lamports()? -= amount;

    // Cập nhật UserState
    if user_state.amount_staked == 0 {
        // Lần đầu stake
        user_state.user = ctx.accounts.user.key();
        user_state.battle_id = battle.battle_id;
        user_state.team = team;
        user_state.amount_staked = amount;
        user_state.stake_time = clock.unix_timestamp;
        user_state.claimed = false;
        user_state.bump = ctx.bumps.get("user_state").copied().ok_or(MemeWarsError::InvalidVault)?;
    } else {
        // Boost: thêm tiền vào stake hiện có
        // Kiểm tra user không thể đổi team
        require!(
            user_state.team == team,
            MemeWarsError::InvalidTeam
        );
        user_state.amount_staked = user_state.amount_staked
            .checked_add(amount)
            .ok_or(MemeWarsError::Overflow)?;
    }

    // Khởi tạo Vault nếu chưa có (init_if_needed sẽ tự động khởi tạo)
    // Chỉ cần set các giá trị ban đầu nếu vault mới được tạo
    if vault.total_amount == 0 && vault.lent_amount == 0 {
        vault.battle_id = battle.battle_id;
        vault.team = team;
        vault.lending_position = None;
        vault.bump = ctx.bumps.get("vault").copied().ok_or(MemeWarsError::InvalidVault)?;
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
    let bump = ctx.bumps.get("ticket_mint_authority").copied().ok_or(MemeWarsError::InvalidVault)?;
    let seeds = &[
        b"ticket_mint_authority",
        battle.battle_id.to_le_bytes().as_ref(),
        team.to_le_bytes().as_ref(),
        &[bump],
    ];
    let signer = &[&seeds[..]];

    let cpi_accounts = MintTo {
        mint: ctx.accounts.ticket_mint.to_account_info(),
        to: ctx.accounts.user_ticket_account.to_account_info(),
        authority: ctx.accounts.ticket_mint_authority.to_account_info(),
    };
    let cpi_program = ctx.accounts.token_program.to_account_info();
    let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);

    // Mint 1 token cho mỗi lamport (có thể điều chỉnh tỷ lệ sau)
    token::mint_to(cpi_ctx, amount)?;

    msg!(
        "Deposit successful: User {} staked {} lamports for team {} in battle {}",
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
        seeds = [b"battle", battle.battle_id.to_le_bytes().as_ref()],
        bump = battle.bump
    )]
    pub battle: Account<'info, BattleState>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserState::LEN,
        seeds = [b"user_state", user.key().as_ref(), battle.battle_id.to_le_bytes().as_ref()],
        bump
    )]
    pub user_state: Account<'info, UserState>,

    #[account(
        init_if_needed,
        payer = user,
        space = Vault::LEN,
        seeds = [b"vault", battle.battle_id.to_le_bytes().as_ref(), team.to_le_bytes().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,

    /// Ticket mint cho battle và team này
    #[account(
        init_if_needed,
        payer = user,
        seeds = [b"ticket_mint", battle.battle_id.to_le_bytes().as_ref(), team.to_le_bytes().as_ref()],
        bump,
        mint::decimals = 0,
        mint::authority = ticket_mint_authority
    )]
    pub ticket_mint: Account<'info, Mint>,

    /// Mint authority PDA cho ticket mint
    /// CHECK: PDA được verify qua seeds
    #[account(
        seeds = [b"ticket_mint_authority", battle.battle_id.to_le_bytes().as_ref(), team.to_le_bytes().as_ref()],
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
}

