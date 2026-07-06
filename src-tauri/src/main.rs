// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Menu, MenuItem, SubMenu};

#[tauri::command]
fn open_system_path(path: String) -> Result<(), String> {
    println!("Solicitado abrir: {}", path);
    Ok(())
}

fn main() {
    let menu = Menu::new()
        .add_submenu(SubMenu::new("Arquivo", Menu::new().add_native_item(MenuItem::Quit)))
        .add_submenu(SubMenu::new("Ajuda", Menu::new().add_native_item(MenuItem::About("Mini SAP".to_string()))));

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .menu(menu)
        .invoke_handler(tauri::generate_handler![open_system_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
