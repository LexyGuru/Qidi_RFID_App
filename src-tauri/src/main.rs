// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use pcsc::*;

#[derive(Debug, Serialize, Deserialize)]
struct MaterialCode {
    code: u8,
    name: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ColorCode {
    code: u8,
    name: String,
    hex: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct RFIDSpecs {
    protocol: String,
    frequency: String,
    baud_rate: String,
    operating_distance: String,
    encryption: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct ChipData {
    material_code: u8,
    color_code: u8,
    manufacturer_code: u8,
    uid: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ReaderStatus {
    connected: bool,
    reader_name: Option<String>,
    card_present: bool,
    error: Option<String>,
}

// Default MIFARE Classic key (often FF FF FF FF FF FF)
const DEFAULT_KEY: [u8; 6] = [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF];

// Sector 1, Block 0 address (block 4 in absolute addressing)
const TARGET_SECTOR: u8 = 1;
const TARGET_BLOCK: u8 = 0;
const ABSOLUTE_BLOCK: u8 = TARGET_SECTOR * 4 + TARGET_BLOCK;

#[tauri::command]
fn get_material_codes() -> Vec<MaterialCode> {
    vec![
        MaterialCode { code: 1, name: "PLA".to_string() },
        MaterialCode { code: 2, name: "PLA Matte".to_string() },
        MaterialCode { code: 3, name: "PLA Metal".to_string() },
        MaterialCode { code: 4, name: "PLA Silk".to_string() },
        MaterialCode { code: 5, name: "PLA-CF".to_string() },
        MaterialCode { code: 6, name: "PLA-Wood".to_string() },
        MaterialCode { code: 7, name: "PLA Basic".to_string() },
        MaterialCode { code: 8, name: "PLA Matte Basic".to_string() },
        MaterialCode { code: 11, name: "ABS".to_string() },
        MaterialCode { code: 12, name: "ABS-GF".to_string() },
        MaterialCode { code: 13, name: "ABS-Metal".to_string() },
        MaterialCode { code: 14, name: "ABS-Odorless".to_string() },
        MaterialCode { code: 18, name: "ASA".to_string() },
        MaterialCode { code: 19, name: "ASA-AERO".to_string() },
        MaterialCode { code: 24, name: "UltraPA".to_string() },
        MaterialCode { code: 25, name: "PA-CF".to_string() },
        MaterialCode { code: 26, name: "UltraPA-CF25".to_string() },
        MaterialCode { code: 27, name: "PA12-CF".to_string() },
        MaterialCode { code: 30, name: "PAHT-CF".to_string() },
        MaterialCode { code: 31, name: "PAHT-GF".to_string() },
        MaterialCode { code: 32, name: "Support For PAHT".to_string() },
        MaterialCode { code: 33, name: "Support For PET/PA".to_string() },
        MaterialCode { code: 34, name: "PC/ABS-FR".to_string() },
        MaterialCode { code: 37, name: "PET-CF".to_string() },
        MaterialCode { code: 38, name: "PET-GF".to_string() },
        MaterialCode { code: 39, name: "PETG Basic".to_string() },
        MaterialCode { code: 40, name: "PETG Tough".to_string() },
        MaterialCode { code: 41, name: "PETG Rapido".to_string() },
        MaterialCode { code: 42, name: "PETG-CF".to_string() },
        MaterialCode { code: 43, name: "PETG-GF".to_string() },
        MaterialCode { code: 44, name: "PPS-CF".to_string() },
        MaterialCode { code: 45, name: "PETG Translucent".to_string() },
        MaterialCode { code: 47, name: "PVA".to_string() },
        MaterialCode { code: 49, name: "TPU-Aero".to_string() },
        MaterialCode { code: 50, name: "TPU".to_string() },
    ]
}

#[tauri::command]
fn get_color_codes() -> Vec<ColorCode> {
    vec![
        ColorCode { code: 1, name: "White".to_string(), hex: "#FAFAFA".to_string() },
        ColorCode { code: 2, name: "Black".to_string(), hex: "#060606".to_string() },
        ColorCode { code: 3, name: "Light Blue".to_string(), hex: "#D9E3ED".to_string() },
        ColorCode { code: 4, name: "Lime Green".to_string(), hex: "#5CF30F".to_string() },
        ColorCode { code: 5, name: "Mint Green".to_string(), hex: "#63E492".to_string() },
        ColorCode { code: 6, name: "Blue".to_string(), hex: "#2850FF".to_string() },
        ColorCode { code: 7, name: "Pink".to_string(), hex: "#FE98FE".to_string() },
        ColorCode { code: 8, name: "Yellow".to_string(), hex: "#DFD628".to_string() },
        ColorCode { code: 9, name: "Dark Green".to_string(), hex: "#228332".to_string() },
        ColorCode { code: 10, name: "Sky Blue".to_string(), hex: "#99DEFF".to_string() },
        ColorCode { code: 11, name: "Navy Blue".to_string(), hex: "#1714B0".to_string() },
        ColorCode { code: 12, name: "Lavender".to_string(), hex: "#CEC0FE".to_string() },
        ColorCode { code: 13, name: "Lime Yellow".to_string(), hex: "#CADE4B".to_string() },
        ColorCode { code: 14, name: "Royal Blue".to_string(), hex: "#1353AB".to_string() },
        ColorCode { code: 15, name: "Light Blue 2".to_string(), hex: "#5EA9FD".to_string() },
        ColorCode { code: 16, name: "Purple".to_string(), hex: "#A878FF".to_string() },
        ColorCode { code: 17, name: "Coral".to_string(), hex: "#FE717A".to_string() },
        ColorCode { code: 18, name: "Red".to_string(), hex: "#FF362D".to_string() },
        ColorCode { code: 19, name: "Beige".to_string(), hex: "#E2DFCD".to_string() },
        ColorCode { code: 20, name: "Gray".to_string(), hex: "#898F9B".to_string() },
        ColorCode { code: 21, name: "Brown".to_string(), hex: "#6E3812".to_string() },
        ColorCode { code: 22, name: "Khaki".to_string(), hex: "#CAC59F".to_string() },
        ColorCode { code: 23, name: "Orange".to_string(), hex: "#F28636".to_string() },
        ColorCode { code: 24, name: "Dark Brown".to_string(), hex: "#B87F2B".to_string() },
    ]
}

#[tauri::command]
fn get_rfid_specs() -> RFIDSpecs {
    RFIDSpecs {
        protocol: "ISO/IEC 14443-A".to_string(),
        frequency: "13.56 MHz".to_string(),
        baud_rate: "106 Kbit/s".to_string(),
        operating_distance: "Not less than 100 mm (dependent on antenna size)".to_string(),
        encryption: "Compliant with M1 standard".to_string(),
    }
}

#[tauri::command]
fn check_reader_status() -> ReaderStatus {
    println!("[RUST] check_reader_status called");
    match Context::establish(Scope::User) {
        Ok(ctx) => {
            let mut buffer = [0u8; 2048];
            match ctx.list_readers(&mut buffer) {
                Ok(readers) => {
                    let readers_vec: Vec<_> = readers.collect();
                    if readers_vec.is_empty() {
                        ReaderStatus {
                            connected: false,
                            reader_name: None,
                            card_present: false,
                            error: Some("Nincs RFID olvasó csatlakoztatva".to_string()),
                        }
                    } else {
                        let reader_name = readers_vec[0].to_string_lossy().to_string();
                        // Try to connect and check for card
                        match ctx.connect(&readers_vec[0], ShareMode::Shared, Protocols::ANY) {
                            Ok(_card) => {
                                ReaderStatus {
                                    connected: true,
                                    reader_name: Some(reader_name),
                                    card_present: true,
                                    error: None,
                                }
                            }
                            Err(Error::NoSmartcard) => {
                                ReaderStatus {
                                    connected: true,
                                    reader_name: Some(reader_name),
                                    card_present: false,
                                    error: Some("Nincs kártya az olvasón".to_string()),
                                }
                            }
                            Err(e) => {
                                ReaderStatus {
                                    connected: true,
                                    reader_name: Some(reader_name),
                                    card_present: false,
                                    error: Some(format!("Hiba: {}", e)),
                                }
                            }
                        }
                    }
                }
                Err(e) => {
                    ReaderStatus {
                        connected: false,
                        reader_name: None,
                        card_present: false,
                        error: Some(format!("Nem lehet listázni az olvasókat: {}", e)),
                    }
                }
            }
        }
        Err(e) => {
            ReaderStatus {
                connected: false,
                reader_name: None,
                card_present: false,
                error: Some(format!("Nem lehet kapcsolódni a PC/SC szolgáltatáshoz: {}", e)),
            }
        }
    }
}

#[tauri::command]
fn read_chip() -> Result<ChipData, String> {
    println!("[RUST] read_chip called");
    let ctx = Context::establish(Scope::User)
        .map_err(|e| {
            println!("[RUST] PC/SC connection error: {}", e);
            format!("PC/SC kapcsolat hiba: {}", e)
        })?;
    println!("[RUST] PC/SC context established");
    
    let mut buffer = [0u8; 2048];
    let readers = ctx.list_readers(&mut buffer)
        .map_err(|e| format!("Olvasó listázás hiba: {}", e))?;
    
    let readers_vec: Vec<_> = readers.collect();
    if readers_vec.is_empty() {
        return Err("Nincs RFID olvasó csatlakoztatva".to_string());
    }
    
    let card = ctx.connect(&readers_vec[0], ShareMode::Shared, Protocols::ANY)
        .map_err(|e| format!("Kártya kapcsolat hiba: {}", e))?;
    
    // Get UID using GET DATA command
    let get_uid = [0xFF, 0xCA, 0x00, 0x00, 0x00];
    let mut uid = None;
    let mut recv_buffer = [0u8; 256];
    
    match card.transmit(&get_uid, &mut recv_buffer) {
        Ok(data) => {
            if data.len() >= 2 && data[data.len() - 2] == 0x90 && data[data.len() - 1] == 0x00 {
                let uid_bytes = &data[..data.len() - 2];
                uid = Some(hex::encode(uid_bytes));
            }
        }
        Err(_) => {
            // UID reading failed, continue without it
        }
    }
    
    // Load authentication key
    let load_key = [0xFF, 0x82, 0x00, 0x00, 0x06, DEFAULT_KEY[0], DEFAULT_KEY[1], DEFAULT_KEY[2], DEFAULT_KEY[3], DEFAULT_KEY[4], DEFAULT_KEY[5]];
    let mut recv_buffer = [0u8; 256];
    card.transmit(&load_key, &mut recv_buffer)
        .map_err(|e| format!("Kulcs betöltés hiba: {}", e))?;
    
    // Authenticate sector 1
    let auth = [0xFF, 0x86, 0x00, 0x00, 0x05, 0x01, 0x00, ABSOLUTE_BLOCK, 0x60, 0x00];
    let mut recv_buffer = [0u8; 256];
    let auth_result = card.transmit(&auth, &mut recv_buffer)
        .map_err(|e| format!("Autentikáció hiba: {}", e))?;
    
    if auth_result.len() < 2 || auth_result[auth_result.len() - 2] != 0x90 {
        return Err("Autentikáció sikertelen. Lehet, hogy más kulcsot használ a kártya.".to_string());
    }
    
    // Read block 4 (Sector 1, Block 0)
    let read_block = [0xFF, 0xB0, 0x00, ABSOLUTE_BLOCK, 0x10];
    let mut recv_buffer = [0u8; 256];
    let read_result = card.transmit(&read_block, &mut recv_buffer)
        .map_err(|e| format!("Olvasás hiba: {}", e))?;
    
    if read_result.len() < 18 {
        return Err("Olvasási hiba: nem megfelelő adathossz".to_string());
    }
    
    let data = &read_result[..16];
    
    println!("[RUST] Read data block: {:?}", data);
    println!("[RUST] Material code: {}, Color code: {}, Manufacturer code: {}", 
             data[0], data[1], data[2]);
    
    Ok(ChipData {
        material_code: data[0],
        color_code: data[1],
        manufacturer_code: data[2],
        uid,
    })
}

#[tauri::command]
fn write_chip(material_code: u8, color_code: u8, manufacturer_code: Option<u8>) -> Result<String, String> {
    println!("[RUST] write_chip called with: material={}, color={}, manufacturer={:?}", 
             material_code, color_code, manufacturer_code);
    
    // Validate inputs
    if material_code == 0 || material_code > 50 {
        println!("[RUST] Invalid material code: {}", material_code);
        return Err("Érvénytelen anyagkód (1-50)".to_string());
    }
    
    if color_code == 0 || color_code > 24 {
        println!("[RUST] Invalid color code: {}", color_code);
        return Err("Érvénytelen színkód (1-24)".to_string());
    }
    
    let mfg_code = manufacturer_code.unwrap_or(1);
    println!("[RUST] Using manufacturer code: {}", mfg_code);
    
    let ctx = Context::establish(Scope::User)
        .map_err(|e| format!("PC/SC kapcsolat hiba: {}", e))?;
    
    let mut buffer = [0u8; 2048];
    let readers = ctx.list_readers(&mut buffer)
        .map_err(|e| format!("Olvasó listázás hiba: {}", e))?;
    
    let readers_vec: Vec<_> = readers.collect();
    if readers_vec.is_empty() {
        return Err("Nincs RFID olvasó csatlakoztatva".to_string());
    }
    
    let card = ctx.connect(&readers_vec[0], ShareMode::Shared, Protocols::ANY)
        .map_err(|e| format!("Kártya kapcsolat hiba: {}", e))?;
    
    // Load authentication key
    let load_key = [0xFF, 0x82, 0x00, 0x00, 0x06, DEFAULT_KEY[0], DEFAULT_KEY[1], DEFAULT_KEY[2], DEFAULT_KEY[3], DEFAULT_KEY[4], DEFAULT_KEY[5]];
    let mut recv_buffer = [0u8; 256];
    card.transmit(&load_key, &mut recv_buffer)
        .map_err(|e| format!("Kulcs betöltés hiba: {}", e))?;
    
    // Authenticate sector 1
    let auth = [0xFF, 0x86, 0x00, 0x00, 0x05, 0x01, 0x00, ABSOLUTE_BLOCK, 0x60, 0x00];
    let mut recv_buffer = [0u8; 256];
    let auth_result = card.transmit(&auth, &mut recv_buffer)
        .map_err(|e| format!("Autentikáció hiba: {}", e))?;
    
    if auth_result.len() < 2 || auth_result[auth_result.len() - 2] != 0x90 {
        return Err("Autentikáció sikertelen. Lehet, hogy más kulcsot használ a kártya.".to_string());
    }
    
    // Prepare data block (16 bytes)
    let mut data = vec![material_code, color_code, mfg_code];
    // Fill rest with zeros
    data.extend(vec![0u8; 13]);
    
    println!("[RUST] Prepared data block: {:?}", data);
    println!("[RUST] Data bytes: [0]={} (material), [1]={} (color), [2]={} (manufacturer)", 
             data[0], data[1], data[2]);
    
    // Write block 4 (Sector 1, Block 0)
    let mut write_cmd = vec![0xFF, 0xD6, 0x00, ABSOLUTE_BLOCK, 0x10];
    write_cmd.extend_from_slice(&data);
    
    println!("[RUST] Write command: {:?}", write_cmd);
    println!("[RUST] Writing to absolute block: {}", ABSOLUTE_BLOCK);
    
    let mut recv_buffer = [0u8; 256];
    let write_result = card.transmit(&write_cmd, &mut recv_buffer)
        .map_err(|e| {
            println!("[RUST] Write transmit error: {}", e);
            format!("Írás hiba: {}", e)
        })?;
    
    println!("[RUST] Write result: {:?}", write_result);
    
    if write_result.len() < 2 || write_result[write_result.len() - 2] != 0x90 {
        println!("[RUST] Write failed - status code: {:?}", 
                 if write_result.len() >= 2 { 
                     format!("{:02X} {:02X}", write_result[write_result.len() - 2], write_result[write_result.len() - 1])
                 } else {
                     "too short".to_string()
                 });
        return Err("Írás sikertelen".to_string());
    }
    
    println!("[RUST] Write successful! Written: Material={}, Color={}, Manufacturer={}", 
             material_code, color_code, mfg_code);
    
    Ok(format!("Material={}, Color={}, Manufacturer={}", material_code, color_code, mfg_code))
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_material_codes,
            get_color_codes,
            get_rfid_specs,
            check_reader_status,
            read_chip,
            write_chip
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
