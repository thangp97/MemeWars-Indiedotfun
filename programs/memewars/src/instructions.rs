use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, MintTo, Token, TokenAccount};

use crate::constants;
use crate::lending;
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
    **vault.to_account_info().try_borrow_mut_lamports()? += amount;
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
        // Bump is automatically provided by Anchor when using seeds with bump
        // We can derive it or get it from the account's key derivation
        let (_, user_state_bump) = Pubkey::find_program_address(
            &[
                b"user_state",
                ctx.accounts.user.key().as_ref(),
                battle.battle_id.to_le_bytes().as_ref(),
            ],
            ctx.program_id,
        );
        user_state.bump = user_state_bump;
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
        // Derive vault bump
        let (_, vault_bump) = Pubkey::find_program_address(
            &[
                b"vault",
                battle.battle_id.to_le_bytes().as_ref(),
                team.to_le_bytes().as_ref(),
            ],
            ctx.program_id,
        );
        vault.bump = vault_bump;
    }

    // Cập nhật Vault
    vault.total_amount = vault.total_amount
        .checked_add(amount)
        .ok_or(MemeWarsError::Overflow)?;

    // Tích hợp Lending: Gửi SOL vào lending protocol để sinh lãi
    // Chỉ gửi số tiền mới deposit vào lending (không gửi lại số đã gửi)
    // 
    // Lưu ý về Reward Distribution (khi implement settle() và claim_reward()):
    // - Team thắng: Nhận vốn gốc + lãi của mình + TOÀN BỘ lãi của team thua
    // - Team thua: Chỉ nhận vốn gốc (không có lãi, vì lãi đã chuyển cho team thắng)
    let amount_to_lend = amount;
    
    // Kiểm tra xem có lending integration được cung cấp không
    // Nếu có, thực hiện CPI call để deposit vào lending protocol
    if let Some(_lending_program_ref) = ctx.accounts.lending_program.as_ref() {
        // Xác định lending protocol (có thể config hoặc detect từ program ID)
        // Mặc định sử dụng Marinade vì đơn giản và ổn định
        let protocol = lending::LendingProtocol::Marinade;
        
        // Tạo lending accounts structure cho Marinade
        let lending_accounts = lending::LendingAccounts {
            lending_program: ctx.accounts.lending_program.as_ref().map(|v| v.to_account_info()),
            // Marinade accounts
            state_account: ctx.accounts.marinade_state.as_ref().map(|v| v.to_account_info()),
            mint_account: ctx.accounts.lending_mint_account.as_ref().map(|v| v.to_account_info()),
            token_account: ctx.accounts.lending_token_account.as_ref().map(|v| v.to_account_info()),
            pool_sol_account: ctx.accounts.marinade_liq_pool_sol.as_ref().map(|v| v.to_account_info()),
            pool_msol_account: ctx.accounts.marinade_liq_pool_msol.as_ref().map(|v| v.to_account_info()),
            pool_authority_account: ctx.accounts.marinade_liq_pool_authority.as_ref().map(|v| v.to_account_info()),
            reserve_account: ctx.accounts.marinade_reserve.as_ref().map(|v| v.to_account_info()),
            mint_authority_account: ctx.accounts.marinade_msol_mint_authority.as_ref().map(|v| v.to_account_info()),
            // Marginfi accounts
            group_account: ctx.accounts.lending_group_account.as_ref().map(|v| v.to_account_info()),
            user_account: ctx.accounts.lending_user_account.as_ref().map(|v| v.to_account_info()),
            // Kamino accounts
            pool_account: ctx.accounts.lending_pool_account.as_ref().map(|v| v.to_account_info()),
            // Common accounts
            system_program: Some(ctx.accounts.system_program.to_account_info()),
            token_program_account: Some(ctx.accounts.token_program.to_account_info()),
        };
        
        // Gọi lending deposit
        match lending::deposit_to_lending(
            protocol,
            &vault.to_account_info(),
            amount_to_lend,
            lending_accounts,
        ) {
            Ok(lending_position) => {
                // Cập nhật vault với lending position
                if vault.lending_position.is_none() {
                    vault.lending_position = Some(lending_position);
                }
                vault.lent_amount = vault.lent_amount
                    .checked_add(amount_to_lend)
                    .ok_or(MemeWarsError::Overflow)?;
                
                msg!("Deposited {} lamports to lending protocol", amount_to_lend);
            }
            Err(e) => {
                // Nếu lending fail, log warning nhưng vẫn tiếp tục
                // Trong production có thể muốn revert hoặc handle khác
                msg!("Warning: Failed to deposit to lending: {:?}", e);
                // SOL vẫn ở trong vault, có thể thử lại sau
            }
        }
    } else {
        msg!("Lending integration skipped - program not provided");
    }

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
    // Derive ticket_mint_authority bump
    let battle_id_bytes = battle.battle_id.to_le_bytes();
    let team_bytes = team.to_le_bytes();
    let (_, ticket_mint_authority_bump) = Pubkey::find_program_address(
        &[
            b"ticket_mint_authority",
            battle_id_bytes.as_ref(),
            team_bytes.as_ref(),
        ],
        ctx.program_id,
    );
    let bump = ticket_mint_authority_bump;
    let seeds = &[
        b"ticket_mint_authority",
        battle_id_bytes.as_ref(),
        team_bytes.as_ref(),
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

    /// Lending program (Marinade, Marginfi, hoặc Kamino)
    /// CHECK: Optional program cho lending integration
    pub lending_program: Option<UncheckedAccount<'info>>,

    // Marinade accounts
    /// Marinade state account
    /// CHECK: Required for Marinade integration
    pub marinade_state: Option<UncheckedAccount<'info>>,

    /// mSOL mint address
    /// CHECK: Required for Marinade integration
    pub lending_mint_account: Option<UncheckedAccount<'info>>,

    /// mSOL token account (owned by vault PDA)
    /// CHECK: Required for Marinade integration - must be owned by vault
    pub lending_token_account: Option<UncheckedAccount<'info>>,

    /// Marinade liquidity pool SOL leg PDA
    /// CHECK: Required for Marinade integration
    pub marinade_liq_pool_sol: Option<UncheckedAccount<'info>>,

    /// Marinade liquidity pool mSOL leg
    /// CHECK: Required for Marinade integration
    pub marinade_liq_pool_msol: Option<UncheckedAccount<'info>>,

    /// Marinade liquidity pool mSOL authority
    /// CHECK: Required for Marinade integration
    pub marinade_liq_pool_authority: Option<UncheckedAccount<'info>>,

    /// Marinade reserve PDA
    /// CHECK: Required for Marinade integration
    pub marinade_reserve: Option<UncheckedAccount<'info>>,

    /// mSOL mint authority
    /// CHECK: Required for Marinade integration
    pub marinade_msol_mint_authority: Option<UncheckedAccount<'info>>,

    // Marginfi accounts
    /// Lending group account (cho Marginfi: marginfi_group)
    /// CHECK: Optional - chỉ cần cho Marginfi
    pub lending_group_account: Option<UncheckedAccount<'info>>,

    /// Lending user account (cho Marginfi/Kamino: user's lending account)
    /// CHECK: Optional - chỉ cần cho Marginfi/Kamino
    pub lending_user_account: Option<UncheckedAccount<'info>>,

    // Kamino accounts
    /// Lending pool account (cho Kamino: lending_pool)
    /// CHECK: Optional - chỉ cần cho Kamino
    pub lending_pool_account: Option<UncheckedAccount<'info>>,

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

