use anchor_lang::prelude::*;

/// Lending protocol integration module
/// Hỗ trợ tích hợp với Marginfi, Kamino, hoặc Marinade Finance

/// Marinade Finance - Native SOL staking
/// Đơn giản và ổn định, tốt cho MVP
pub mod marinade {
    use super::*;
    use anchor_lang::solana_program::{
        instruction::{AccountMeta, Instruction},
        program::invoke,
    };

    /// Marinade Finance Program ID (Mainnet)
    pub const MARINADE_PROGRAM_ID: &str = "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD";

    /// Marinade deposit instruction discriminator
    /// Source: https://github.com/marinade-finance/liquid-staking-program
    /// Instruction format: discriminator (u8) + lamports (u64)
    const MARINADE_DEPOSIT_DISCRIMINATOR: u8 = 0;

    /// Deposit SOL vào Marinade Finance để nhận mSOL
    /// 
    /// # Arguments
    /// * `vault` - Vault account chứa SOL (sẽ transfer SOL từ đây)
    /// * `amount` - Số lượng lamports cần stake
    /// * `marinade_state` - Marinade state account
    /// * `m_sol_mint` - mSOL mint address
    /// * `m_sol_token_account` - Token account để nhận mSOL (owned by vault PDA)
    /// * `liq_pool_sol` - Liquidity pool SOL leg PDA
    /// * `liq_pool_msol` - Liquidity pool mSOL leg
    /// * `liq_pool_msol_authority` - Liquidity pool mSOL authority
    /// * `reserve` - Reserve PDA
    /// * `msol_mint_authority` - mSOL mint authority
    /// * `marinade_program` - Marinade program account
    /// * `system_program` - System program
    /// * `token_program` - Token program
    /// 
    /// # Returns
    /// * `Result<Pubkey>` - mSOL token account pubkey (lending position)
    pub fn deposit_to_marinade<'info>(
        vault: &AccountInfo<'info>,
        amount: u64,
        marinade_state: AccountInfo<'info>,
        m_sol_mint: AccountInfo<'info>,
        m_sol_token_account: AccountInfo<'info>,
        liq_pool_sol: AccountInfo<'info>,
        liq_pool_msol: AccountInfo<'info>,
        liq_pool_msol_authority: AccountInfo<'info>,
        reserve: AccountInfo<'info>,
        msol_mint_authority: AccountInfo<'info>,
        marinade_program: AccountInfo<'info>,
        system_program: AccountInfo<'info>,
        token_program: AccountInfo<'info>,
    ) -> Result<Pubkey> {
        msg!("Depositing {} lamports to Marinade Finance", amount);

        // Marinade deposit instruction format:
        // discriminator (1 byte) + amount (8 bytes)
        let mut instruction_data = Vec::with_capacity(9);
        instruction_data.push(MARINADE_DEPOSIT_DISCRIMINATOR);
        instruction_data.extend_from_slice(&amount.to_le_bytes());

        // Accounts theo thứ tự của Marinade deposit instruction:
        // Reference: https://github.com/marinade-finance/liquid-staking-program
        let accounts = vec![
            AccountMeta::new(*marinade_state.key, false),
            AccountMeta::new(*m_sol_mint.key, false),
            AccountMeta::new(*liq_pool_sol.key, false),
            AccountMeta::new(*liq_pool_msol.key, false),
            AccountMeta::new_readonly(*liq_pool_msol_authority.key, false),
            AccountMeta::new(*reserve.key, false),
            AccountMeta::new(*vault.key, true), // signer (vault PDA)
            AccountMeta::new(*m_sol_token_account.key, false),
            AccountMeta::new_readonly(*msol_mint_authority.key, false),
            AccountMeta::new_readonly(*system_program.key, false),
            AccountMeta::new_readonly(*token_program.key, false),
        ];

        let instruction = Instruction {
            program_id: *marinade_program.key,
            accounts,
            data: instruction_data,
        };

        // Invoke Marinade deposit instruction
        // Note: invoke expects AccountInfo values, not references
        // Save key before moving m_sol_token_account
        let m_sol_token_account_key = *m_sol_token_account.key;
        invoke(
            &instruction,
            &[
                marinade_state,
                m_sol_mint,
                liq_pool_sol,
                liq_pool_msol,
                liq_pool_msol_authority,
                reserve,
                vault.clone(),
                m_sol_token_account,
                msol_mint_authority,
                system_program,
                token_program,
                marinade_program,
            ],
        )?;

        msg!("Successfully deposited {} lamports to Marinade, received mSOL", amount);
        
        Ok(m_sol_token_account_key)
    }
}

pub mod marginfi {
    use super::*;

    /// Marginfi v2 Program ID (Mainnet)
    /// Source: https://docs.marginfi.com/
    pub const MARGINFI_PROGRAM_ID: &str = "MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7F4n1T4L3zF";

    /// Deposit SOL vào Marginfi lending pool
    /// 
    /// # Arguments
    /// * `vault` - Vault account chứa SOL
    /// * `amount` - Số lượng lamports cần deposit
    /// * `marginfi_group` - Marginfi group account
    /// * `marginfi_account` - Marginfi margin account (user's account)
    /// * `marginfi_program` - Marginfi program account
    /// 
    /// # Returns
    /// * `Result<Pubkey>` - Marginfi account pubkey (lending position)
    pub fn deposit_to_marginfi<'info>(
        _vault: &AccountInfo<'info>,
        _amount: u64,
        _marginfi_group: AccountInfo<'info>,
        marginfi_account: AccountInfo<'info>,
        _marginfi_program: AccountInfo<'info>,
    ) -> Result<Pubkey> {
        msg!("Depositing {} lamports to Marginfi", _amount);
        
        // Marginfi v2 sử dụng instruction: deposit(amount)
        // Cần các accounts theo Marginfi v2 structure:
        // - marginfi_group: Group account
        // - marginfi_account: User's margin account
        // - signer: Authority
        // - bank: Bank account for the asset
        // - bank_mint: Mint of the asset
        // - bank_liquidity_vault: Liquidity vault
        // - bank_liquidity_vault_authority: Vault authority
        // - user_token_account: User's token account (source)
        // - token_program
        // - system_program

        // TODO: Implement actual Marginfi v2 CPI call
        // Cần Marginfi v2 SDK hoặc instruction interface
        // Ví dụ structure:
        // let cpi_accounts = MarginfiDeposit {
        //     marginfi_group: marginfi_group.to_account_info(),
        //     marginfi_account: marginfi_account.to_account_info(),
        //     signer: vault.to_account_info(),
        //     bank: bank_account.to_account_info(),
        //     bank_mint: bank_mint.to_account_info(),
        //     bank_liquidity_vault: liquidity_vault.to_account_info(),
        //     bank_liquidity_vault_authority: vault_authority.to_account_info(),
        //     user_token_account: vault.to_account_info(),
        //     token_program: token_program.to_account_info(),
        //     system_program: system_program.to_account_info(),
        // };
        // let cpi_program = marginfi_program.to_account_info();
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // marginfi::deposit(cpi_ctx, amount)?;
        
        // Placeholder: return marginfi account pubkey
        Ok(*marginfi_account.key)
    }
}

pub mod kamino {
    use super::*;

    /// Kamino Program ID (Mainnet)
    /// Source: https://docs.kamino.finance/
    pub const KAMINO_PROGRAM_ID: &str = "KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD";

    /// Deposit SOL vào Kamino lending pool
    /// 
    /// # Arguments
    /// * `vault` - Vault account chứa SOL
    /// * `amount` - Số lượng lamports cần deposit
    /// * `lending_pool` - Kamino lending pool account
    /// * `user_account` - Kamino user account
    /// * `kamino_program` - Kamino program account
    /// 
    /// # Returns
    /// * `Result<Pubkey>` - Kamino position pubkey
    pub fn deposit_to_kamino<'info>(
        _vault: &AccountInfo<'info>,
        _amount: u64,
        _lending_pool: AccountInfo<'info>,
        user_account: AccountInfo<'info>,
        _kamino_program: AccountInfo<'info>,
    ) -> Result<Pubkey> {
        msg!("Depositing {} lamports to Kamino", _amount);
        
        // Kamino sử dụng instruction: deposit(amount)
        // Cần các accounts theo Kamino structure:
        // - lending_pool: Lending pool account
        // - user_account: User's Kamino account
        // - authority: Authority signing
        // - reserve: Reserve account
        // - reserve_liquidity_supply: Reserve liquidity supply
        // - user_liquidity_account: User's liquidity token account (source)
        // - token_program
        // - system_program

        // TODO: Implement actual Kamino CPI call
        // Cần Kamino SDK hoặc instruction interface
        // Ví dụ structure:
        // let cpi_accounts = KaminoDeposit {
        //     lending_pool: lending_pool.to_account_info(),
        //     user_account: user_account.to_account_info(),
        //     authority: vault.to_account_info(),
        //     reserve: reserve_account.to_account_info(),
        //     reserve_liquidity_supply: reserve_supply.to_account_info(),
        //     user_liquidity_account: vault.to_account_info(),
        //     token_program: token_program.to_account_info(),
        //     system_program: system_program.to_account_info(),
        // };
        // let cpi_program = kamino_program.to_account_info();
        // let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        // kamino::deposit(cpi_ctx, amount)?;
        
        // Placeholder: return user account pubkey
        Ok(*user_account.key)
    }
}

/// Generic lending interface
/// Cho phép dễ dàng chuyển đổi giữa các lending protocols
#[derive(Clone, Copy)]
pub enum LendingProtocol {
    Marinade,
    Marginfi,
    Kamino,
}

/// Deposit vào lending protocol (generic)
/// 
/// # Arguments
/// * `protocol` - Lending protocol to use
/// * `vault` - Vault account chứa SOL
/// * `amount` - Số lượng lamports
/// * `lending_accounts` - Accounts cần thiết cho lending protocol
/// 
/// # Returns
/// * `Result<Pubkey>` - Lending position pubkey
pub fn deposit_to_lending<'info>(
    protocol: LendingProtocol,
    vault: &AccountInfo<'info>,
    amount: u64,
    lending_accounts: LendingAccounts<'info>,
) -> Result<Pubkey> {
    match protocol {
        LendingProtocol::Marinade => {
            // Marinade cần các accounts:
            // - marinade_state, m_sol_mint, m_sol_token_account
            // - liq_pool_sol, liq_pool_msol, liq_pool_msol_authority
            // - reserve, msol_mint_authority
            // - system_program, token_program
            if let (
                Some(marinade_state),
                Some(m_sol_mint),
                Some(m_sol_token_account),
                Some(liq_pool_sol),
                Some(liq_pool_msol),
                Some(liq_pool_msol_authority),
                Some(reserve),
                Some(msol_mint_authority),
                Some(marinade_program),
                Some(system_program),
                Some(token_program),
            ) = (
                lending_accounts.state_account.clone(),
                lending_accounts.mint_account.clone(),
                lending_accounts.token_account.clone(),
                lending_accounts.pool_sol_account.clone(),
                lending_accounts.pool_msol_account.clone(),
                lending_accounts.pool_authority_account.clone(),
                lending_accounts.reserve_account.clone(),
                lending_accounts.mint_authority_account.clone(),
                lending_accounts.lending_program.clone(),
                lending_accounts.system_program.clone(),
                lending_accounts.token_program_account.clone(),
            ) {
                marinade::deposit_to_marinade(
                    vault,
                    amount,
                    marinade_state,
                    m_sol_mint,
                    m_sol_token_account,
                    liq_pool_sol,
                    liq_pool_msol,
                    liq_pool_msol_authority,
                    reserve,
                    msol_mint_authority,
                    marinade_program,
                    system_program,
                    token_program,
                )
            } else {
                return Err(anchor_lang::error!(LendingError::MissingAccounts));
            }
        }
        LendingProtocol::Marginfi => {
            // Marginfi cần group và margin account
            if let (Some(marginfi_group), Some(marginfi_account), Some(marginfi_program)) = (
                lending_accounts.group_account.clone(),
                lending_accounts.user_account.clone(),
                lending_accounts.lending_program.clone(),
            ) {
                marginfi::deposit_to_marginfi(
                    vault,
                    amount,
                    marginfi_group,
                    marginfi_account,
                    marginfi_program,
                )
            } else {
                return Err(anchor_lang::error!(LendingError::MissingAccounts));
            }
        }
        LendingProtocol::Kamino => {
            // Kamino cần lending pool và user account
            if let (Some(lending_pool), Some(user_account), Some(kamino_program)) = (
                lending_accounts.pool_account.clone(),
                lending_accounts.user_account.clone(),
                lending_accounts.lending_program.clone(),
            ) {
                kamino::deposit_to_kamino(
                    vault,
                    amount,
                    lending_pool,
                    user_account,
                    kamino_program,
                )
            } else {
                return Err(anchor_lang::error!(LendingError::MissingAccounts));
            }
        }
    }
}

/// Accounts structure cho lending protocols
/// Hỗ trợ các loại accounts khác nhau tùy theo protocol
/// Note: Stores AccountInfo values, not references, to avoid lifetime issues
pub struct LendingAccounts<'info> {
    /// Lending program account
    pub lending_program: Option<AccountInfo<'info>>,
    
    // Marinade accounts
    /// Marinade state account
    pub state_account: Option<AccountInfo<'info>>,
    /// Mint account (cho Marinade: mSOL mint)
    pub mint_account: Option<AccountInfo<'info>>,
    /// Token account (cho Marinade: mSOL token account)
    pub token_account: Option<AccountInfo<'info>>,
    /// Liquidity pool SOL leg
    pub pool_sol_account: Option<AccountInfo<'info>>,
    /// Liquidity pool mSOL leg
    pub pool_msol_account: Option<AccountInfo<'info>>,
    /// Liquidity pool mSOL authority
    pub pool_authority_account: Option<AccountInfo<'info>>,
    /// Reserve PDA
    pub reserve_account: Option<AccountInfo<'info>>,
    /// mSOL mint authority
    pub mint_authority_account: Option<AccountInfo<'info>>,
    
    // Marginfi accounts
    /// Group account (cho Marginfi: marginfi_group)
    pub group_account: Option<AccountInfo<'info>>,
    /// User account (cho Marginfi/Kamino: user's lending account)
    pub user_account: Option<AccountInfo<'info>>,
    
    // Kamino accounts
    /// Pool account (cho Kamino: lending_pool)
    pub pool_account: Option<AccountInfo<'info>>,
    
    // Common accounts
    /// System program
    pub system_program: Option<AccountInfo<'info>>,
    /// Token program
    pub token_program_account: Option<AccountInfo<'info>>,
}

#[error_code]
pub enum LendingError {
    #[msg("Missing required accounts for lending protocol")]
    MissingAccounts,
    #[msg("Lending deposit failed")]
    DepositFailed,
    #[msg("Lending withdrawal failed")]
    WithdrawalFailed,
}
