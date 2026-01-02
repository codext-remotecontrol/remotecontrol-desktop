pub mod commands;
pub mod services;

use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Manager, WindowEvent,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            // Focus the main window when a second instance is attempted
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .setup(|app| {
            // Create tray menu
            let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let hide = MenuItem::with_id(app, "hide", "Hide", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

            let menu = Menu::with_items(app, &[&show, &hide, &quit])?;

            // Create tray icon
            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "hide" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    "quit" => {
                        // Stop any screen capture before quitting
                        let _ = commands::screen_capture::stop_screen_capture();
                        let _ = commands::clipboard::stop_clipboard_watch();
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                // Hide window instead of closing on Windows/Linux
                // On macOS this is the expected behavior
                #[cfg(not(target_os = "macos"))]
                {
                    window.hide().unwrap();
                    api.prevent_close();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // Screen capture commands
            commands::screen_capture::get_screens,
            commands::screen_capture::get_screen_size,
            commands::screen_capture::capture_screen,
            commands::screen_capture::capture_screen_thumbnail,
            commands::screen_capture::start_screen_capture,
            commands::screen_capture::stop_screen_capture,
            commands::screen_capture::is_capturing,
            // Input simulation commands
            commands::input_simulation::mouse_move,
            commands::input_simulation::mouse_move_relative,
            commands::input_simulation::mouse_click,
            commands::input_simulation::mouse_double_click,
            commands::input_simulation::mouse_down,
            commands::input_simulation::mouse_up,
            commands::input_simulation::mouse_scroll,
            commands::input_simulation::key_press,
            commands::input_simulation::key_down,
            commands::input_simulation::key_up,
            commands::input_simulation::type_text,
            // Clipboard commands
            commands::clipboard::clipboard_read_text,
            commands::clipboard::clipboard_write_text,
            commands::clipboard::clipboard_read_image,
            commands::clipboard::clipboard_write_image,
            commands::clipboard::clipboard_clear,
            commands::clipboard::start_clipboard_watch,
            commands::clipboard::stop_clipboard_watch,
            commands::clipboard::is_clipboard_watching,
            // System info commands
            commands::system_info::get_machine_id,
            commands::system_info::get_hostname,
            commands::system_info::get_platform,
            commands::system_info::get_arch,
            commands::system_info::get_system_info,
            commands::system_info::hash_password,
            commands::system_info::verify_password,
            commands::system_info::generate_connection_id,
            // Window management commands
            create_remote_window,
            create_info_window,
            close_window,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
async fn create_remote_window(
    app: tauri::AppHandle,
    partner_id: String,
) -> Result<(), String> {
    let label = format!("remote-{}", partner_id);

    let window = tauri::WebviewWindowBuilder::new(
        &app,
        &label,
        tauri::WebviewUrl::App(format!("/remote/{}", partner_id).into()),
    )
    .title(format!("Remote - {}", partner_id))
    .inner_size(1280.0, 720.0)
    .min_inner_size(640.0, 480.0)
    .center()
    .resizable(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn create_info_window(app: tauri::AppHandle) -> Result<(), String> {
    let window = tauri::WebviewWindowBuilder::new(
        &app,
        "info",
        tauri::WebviewUrl::App("/info".into()),
    )
    .title("Connection Info")
    .inner_size(300.0, 100.0)
    .resizable(false)
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .transparent(true)
    .build()
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn close_window(app: tauri::AppHandle, label: String) -> Result<(), String> {
    if let Some(window) = app.get_webview_window(&label) {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
