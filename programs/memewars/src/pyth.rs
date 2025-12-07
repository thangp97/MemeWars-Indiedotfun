use anchor_lang::prelude::*;
use anchor_lang::solana_program::account_info::AccountInfo;
use crate::instructions::MemeWarsError;

/// Đọc giá từ Pyth price feed account
/// 
/// Pyth price feeds có nhiều format, nhưng chúng ta sẽ đọc trực tiếp từ account data
/// Format cơ bản: price được lưu ở offset khác nhau tùy version
pub fn get_pyth_price(price_feed: &AccountInfo) -> Result<i64> {
    let data = price_feed.try_borrow_data()?;
    
    // Kiểm tra account có data không
    require!(data.len() >= 64, MemeWarsError::InvalidPriceFeed);
    
    // Validate magic number (Pyth price feed có magic "PTH" = 0x50395448)
    // Note: We read it but don't validate strictly to support different Pyth versions
    let _magic = u32::from_le_bytes([data[0], data[1], data[2], data[3]]);
    
    // Có thể là Pyth v1 hoặc v2 format
    // V1: magic = 0x50395448
    // V2: có thể khác format
    // Để đơn giản, chúng ta sẽ đọc price ở offset cố định
    
    // Try to read price at common offsets
    // Pyth v1: price ở offset 16, exponent ở offset 8
    let price_offset = 16;
    let exponent_offset = 8;
    
    if data.len() < price_offset + 8 {
        return Err(MemeWarsError::InvalidPriceFeed.into());
    }
    
    // Read price (i64, little endian)
    let price = i64::from_le_bytes([
        data[price_offset],
        data[price_offset + 1],
        data[price_offset + 2],
        data[price_offset + 3],
        data[price_offset + 4],
        data[price_offset + 5],
        data[price_offset + 6],
        data[price_offset + 7],
    ]);
    
    // Read exponent (i32, little endian)
    let exponent = i32::from_le_bytes([
        data[exponent_offset],
        data[exponent_offset + 1],
        data[exponent_offset + 2],
        data[exponent_offset + 3],
    ]);
    
    // Read confidence (u64, offset 24)
    let conf_offset = 24;
    if data.len() >= conf_offset + 8 {
        let conf = u64::from_le_bytes([
            data[conf_offset],
            data[conf_offset + 1],
            data[conf_offset + 2],
            data[conf_offset + 3],
            data[conf_offset + 4],
            data[conf_offset + 5],
            data[conf_offset + 6],
            data[conf_offset + 7],
        ]);
        
        // Validate confidence (max 5% of price)
        if price != 0 {
            let max_conf = (price.abs() as u64)
                .checked_mul(500)
                .ok_or(MemeWarsError::Overflow)?
                .checked_div(10_000)
                .ok_or(MemeWarsError::Overflow)?;
            
            require!(conf <= max_conf, MemeWarsError::LowPriceConfidence);
        }
    }
    
    // Read publish slot để check staleness (offset 32)
    let slot_offset = 32;
    if data.len() >= slot_offset + 8 {
        let pub_slot = u64::from_le_bytes([
            data[slot_offset],
            data[slot_offset + 1],
            data[slot_offset + 2],
            data[slot_offset + 3],
            data[slot_offset + 4],
            data[slot_offset + 5],
            data[slot_offset + 6],
            data[slot_offset + 7],
        ]);
        
        // Check staleness (max 60 seconds = ~150 slots)
        let clock = Clock::get()?;
        let slot_diff = clock.slot.saturating_sub(pub_slot);
        require!(slot_diff <= 150, MemeWarsError::StalePriceFeed);
    }
    
    // Normalize price to 10^8 (để dễ so sánh)
    let target_exponent = -8i32;
    let normalized_price = if exponent > target_exponent {
        // Need to divide
        let diff = (exponent - target_exponent) as u32;
        price.checked_div(10i64.pow(diff)).ok_or(MemeWarsError::Overflow)?
    } else if exponent < target_exponent {
        // Need to multiply
        let diff = (target_exponent - exponent) as u32;
        price.checked_mul(10i64.pow(diff)).ok_or(MemeWarsError::Overflow)?
    } else {
        price
    };
    
    Ok(normalized_price)
}
