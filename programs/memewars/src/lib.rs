use anchor_lang::prelude::*;

pub mod constants;
pub mod instructions;
pub mod lending;
pub mod state;

use instructions::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod memewars {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        msg!("MemeWars program initialized");
        Ok(())
    }

    /// Deposit SOL vào một cuộc chiến và nhận ticket token
    pub fn deposit(ctx: Context<Deposit>, amount: u64, team: u8) -> Result<()> {
        instructions::deposit(ctx, amount, team)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
