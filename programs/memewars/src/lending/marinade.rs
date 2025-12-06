use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
    pubkey::Pubkey,
    system_program,
};
use anchor_spl::token::{self, Token, TokenAccount};

/// Marinade Finance Program ID
pub const MARINADE_PROGRAM_ID: &str = "MarBmsSgKXdrN1egZf5sqe1TMai9K1rChYNDJgjq7aD";

/// Marinade deposit instruction discriminator
/// Source: https://github.com/marinade-finance/liquid-staking-program
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
pub fn deposit_to_marinade(
    vault: &AccountInfo,
    amount: u64,
    marinade_state: &AccountInfo,
    m_sol_mint: &AccountInfo,
    m_sol_token_account: &AccountInfo,
    liq_pool_sol: &AccountInfo,
    liq_pool_msol: &AccountInfo,
    liq_pool_msol_authority: &AccountInfo,
    reserve: &AccountInfo,
    msol_mint_authority: &AccountInfo,
    marinade_program: &AccountInfo,
    system_program: &AccountInfo,
    token_program: &AccountInfo,
) -> Result<Pubkey> {
    msg!("Depositing {} lamports to Marinade Finance", amount);

    // Marinade deposit instruction format:
    // discriminator (1 byte) + amount (8 bytes)
    let mut instruction_data = Vec::with_capacity(9);
    instruction_data.push(MARINADE_DEPOSIT_DISCRIMINATOR);
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    // Accounts theo thứ tự của Marinade deposit instruction:
    let accounts = vec![
        AccountMeta::new(*marinade_state.key, false),
        AccountMeta::new(*m_sol_mint.key, false),
        AccountMeta::new(*liq_pool_sol.key, false),
        AccountMeta::new(*liq_pool_msol.key, false),
        AccountMeta::new_readonly(*liq_pool_msol_authority.key, false),
        AccountMeta::new(*reserve.key, false),
        AccountMeta::new(*vault.key, true), // signer
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
    invoke(
        &instruction,
        &[
            marinade_state.clone(),
            m_sol_mint.clone(),
            liq_pool_sol.clone(),
            liq_pool_msol.clone(),
            liq_pool_msol_authority.clone(),
            reserve.clone(),
            vault.clone(),
            m_sol_token_account.clone(),
            msol_mint_authority.clone(),
            system_program.clone(),
            token_program.clone(),
            marinade_program.clone(),
        ],
    )?;

    msg!("Successfully deposited {} lamports to Marinade, received mSOL", amount);
    
    Ok(m_sol_token_account.key())
}

