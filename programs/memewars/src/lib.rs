use anchor_lang::prelude::*;

pub mod constants;
pub mod state;

use state::*;

declare_id!("Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS");

#[program]
pub mod memewars {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("MemeWars program initialized");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
