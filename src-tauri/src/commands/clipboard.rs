use arboard::Clipboard;
use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;
use tauri::{AppHandle, Emitter};

static CLIPBOARD_WATCHING: AtomicBool = AtomicBool::new(false);
static LAST_CLIPBOARD_CONTENT: once_cell::sync::Lazy<Mutex<String>> =
    once_cell::sync::Lazy::new(|| Mutex::new(String::new()));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipboardContent {
    pub content_type: String, // "text" or "image"
    pub text: Option<String>,
    pub image_base64: Option<String>,
    pub image_width: Option<u32>,
    pub image_height: Option<u32>,
}

#[tauri::command]
pub fn clipboard_read_text() -> Result<String, String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.get_text().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clipboard_write_text(text: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;

    // Update our tracked content to avoid triggering watch events
    {
        let mut last_content = LAST_CLIPBOARD_CONTENT.lock();
        *last_content = text.clone();
    }

    clipboard.set_text(&text).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn clipboard_read_image() -> Result<Option<ClipboardContent>, String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;

    match clipboard.get_image() {
        Ok(image_data) => {
            // Convert to PNG and base64
            let width = image_data.width as u32;
            let height = image_data.height as u32;
            let bytes = image_data.bytes.into_owned();

            // Create image from raw RGBA bytes
            let img = image::RgbaImage::from_raw(width, height, bytes)
                .ok_or_else(|| "Failed to create image from clipboard data".to_string())?;

            let mut buffer = std::io::Cursor::new(Vec::new());
            image::DynamicImage::ImageRgba8(img)
                .write_to(&mut buffer, image::ImageFormat::Png)
                .map_err(|e| e.to_string())?;

            let base64_data = BASE64.encode(buffer.into_inner());

            Ok(Some(ClipboardContent {
                content_type: "image".to_string(),
                text: None,
                image_base64: Some(base64_data),
                image_width: Some(width),
                image_height: Some(height),
            }))
        }
        Err(_) => Ok(None),
    }
}

#[tauri::command]
pub fn clipboard_write_image(base64_data: String) -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;

    // Decode base64 to bytes
    let image_bytes = BASE64.decode(&base64_data).map_err(|e| e.to_string())?;

    // Load image
    let img = image::load_from_memory(&image_bytes).map_err(|e| e.to_string())?;
    let rgba = img.to_rgba8();
    let (width, height) = rgba.dimensions();

    let image_data = arboard::ImageData {
        width: width as usize,
        height: height as usize,
        bytes: std::borrow::Cow::Owned(rgba.into_raw()),
    };

    clipboard.set_image(image_data).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn start_clipboard_watch(app: AppHandle) -> Result<(), String> {
    if CLIPBOARD_WATCHING.load(Ordering::SeqCst) {
        return Ok(()); // Already watching
    }

    CLIPBOARD_WATCHING.store(true, Ordering::SeqCst);

    // Initialize last content
    {
        if let Ok(mut clipboard) = Clipboard::new() {
            if let Ok(text) = clipboard.get_text() {
                let mut last_content = LAST_CLIPBOARD_CONTENT.lock();
                *last_content = text;
            }
        }
    }

    tokio::spawn(async move {
        let check_interval = Duration::from_millis(500);

        while CLIPBOARD_WATCHING.load(Ordering::SeqCst) {
            tokio::time::sleep(check_interval).await;

            if let Ok(mut clipboard) = Clipboard::new() {
                // Check for text changes
                if let Ok(current_text) = clipboard.get_text() {
                    let should_emit = {
                        let last_content = LAST_CLIPBOARD_CONTENT.lock();
                        current_text != *last_content && !current_text.is_empty()
                    };

                    if should_emit {
                        {
                            let mut last_content = LAST_CLIPBOARD_CONTENT.lock();
                            *last_content = current_text.clone();
                        }

                        let content = ClipboardContent {
                            content_type: "text".to_string(),
                            text: Some(current_text),
                            image_base64: None,
                            image_width: None,
                            image_height: None,
                        };

                        if let Err(e) = app.emit("clipboard-changed", &content) {
                            tracing::error!("Failed to emit clipboard change: {}", e);
                        }
                    }
                }
            }
        }

        tracing::info!("Clipboard watch stopped");
    });

    Ok(())
}

#[tauri::command]
pub fn stop_clipboard_watch() -> Result<(), String> {
    CLIPBOARD_WATCHING.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn is_clipboard_watching() -> bool {
    CLIPBOARD_WATCHING.load(Ordering::SeqCst)
}

#[tauri::command]
pub fn clipboard_clear() -> Result<(), String> {
    let mut clipboard = Clipboard::new().map_err(|e| e.to_string())?;
    clipboard.clear().map_err(|e| e.to_string())
}
