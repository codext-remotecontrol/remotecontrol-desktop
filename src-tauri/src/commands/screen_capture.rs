use base64::{engine::general_purpose::STANDARD as BASE64, Engine as _};
use image::codecs::jpeg::JpegEncoder;
use image::ImageEncoder;
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::time::{interval, Duration};
use xcap::Monitor;

static IS_CAPTURING: AtomicBool = AtomicBool::new(false);
static CURRENT_SCREEN_ID: AtomicU32 = AtomicU32::new(0);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
    pub scale_factor: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenSize {
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub fn get_screens() -> Result<Vec<ScreenInfo>, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    let screens: Vec<ScreenInfo> = monitors
        .into_iter()
        .enumerate()
        .map(|(idx, monitor)| {
            ScreenInfo {
                id: idx as u32,
                name: monitor.name().to_string(),
                width: monitor.width(),
                height: monitor.height(),
                x: monitor.x(),
                y: monitor.y(),
                is_primary: monitor.is_primary(),
                scale_factor: monitor.scale_factor(),
            }
        })
        .collect();

    Ok(screens)
}

#[tauri::command]
pub fn get_screen_size(screen_id: u32) -> Result<ScreenSize, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    let monitor = monitors
        .get(screen_id as usize)
        .ok_or_else(|| format!("Screen {} not found", screen_id))?;

    Ok(ScreenSize {
        width: monitor.width(),
        height: monitor.height(),
    })
}

#[tauri::command]
pub fn capture_screen(screen_id: u32, quality: Option<u8>) -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    let monitor = monitors
        .get(screen_id as usize)
        .ok_or_else(|| format!("Screen {} not found", screen_id))?;

    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    let jpeg_quality = quality.unwrap_or(75);
    encode_frame_jpeg(&image, jpeg_quality)
}

#[tauri::command]
pub async fn start_screen_capture(
    screen_id: u32,
    fps: u32,
    quality: Option<u8>,
    app: AppHandle,
) -> Result<(), String> {
    if IS_CAPTURING.load(Ordering::SeqCst) {
        // Stop existing capture first
        IS_CAPTURING.store(false, Ordering::SeqCst);
        tokio::time::sleep(Duration::from_millis(100)).await;
    }

    IS_CAPTURING.store(true, Ordering::SeqCst);
    CURRENT_SCREEN_ID.store(screen_id, Ordering::SeqCst);

    let frame_duration = Duration::from_millis(1000 / fps.max(1).min(60) as u64);
    let jpeg_quality = quality.unwrap_or(75);

    tokio::spawn(async move {
        let monitors = match Monitor::all() {
            Ok(m) => m,
            Err(e) => {
                tracing::error!("Failed to get monitors: {}", e);
                return;
            }
        };

        let monitor = match monitors.get(screen_id as usize) {
            Some(m) => m.clone(),
            None => {
                tracing::error!("Monitor {} not found", screen_id);
                return;
            }
        };

        let mut ticker = interval(frame_duration);
        let mut frame_count: u64 = 0;
        let mut last_error_time = std::time::Instant::now();
        let error_cooldown = Duration::from_secs(5);

        while IS_CAPTURING.load(Ordering::SeqCst)
            && CURRENT_SCREEN_ID.load(Ordering::SeqCst) == screen_id
        {
            ticker.tick().await;

            match monitor.capture_image() {
                Ok(image) => {
                    match encode_frame_jpeg(&image, jpeg_quality) {
                        Ok(base64_data) => {
                            if let Err(e) = app.emit("screen-frame", &base64_data) {
                                if last_error_time.elapsed() > error_cooldown {
                                    tracing::error!("Failed to emit frame: {}", e);
                                    last_error_time = std::time::Instant::now();
                                }
                            }
                            frame_count += 1;
                        }
                        Err(e) => {
                            if last_error_time.elapsed() > error_cooldown {
                                tracing::error!("Failed to encode frame: {}", e);
                                last_error_time = std::time::Instant::now();
                            }
                        }
                    }
                }
                Err(e) => {
                    if last_error_time.elapsed() > error_cooldown {
                        tracing::error!("Failed to capture screen: {}", e);
                        last_error_time = std::time::Instant::now();
                    }
                }
            }
        }

        tracing::info!("Screen capture stopped after {} frames", frame_count);
    });

    Ok(())
}

#[tauri::command]
pub fn stop_screen_capture() -> Result<(), String> {
    IS_CAPTURING.store(false, Ordering::SeqCst);
    Ok(())
}

#[tauri::command]
pub fn is_capturing() -> bool {
    IS_CAPTURING.load(Ordering::SeqCst)
}

fn encode_frame_jpeg(image: &image::RgbaImage, quality: u8) -> Result<String, String> {
    let (width, height) = image.dimensions();
    let rgb_image = image::DynamicImage::ImageRgba8(image.clone()).to_rgb8();

    let mut buffer = Cursor::new(Vec::with_capacity((width * height * 3) as usize));

    let encoder = JpegEncoder::new_with_quality(&mut buffer, quality);
    encoder
        .write_image(&rgb_image, width, height, image::ExtendedColorType::Rgb8)
        .map_err(|e| e.to_string())?;

    Ok(BASE64.encode(buffer.into_inner()))
}

#[tauri::command]
pub fn capture_screen_thumbnail(screen_id: u32, max_width: u32) -> Result<String, String> {
    let monitors = Monitor::all().map_err(|e| e.to_string())?;

    let monitor = monitors
        .get(screen_id as usize)
        .ok_or_else(|| format!("Screen {} not found", screen_id))?;

    let image = monitor.capture_image().map_err(|e| e.to_string())?;

    // Calculate thumbnail dimensions maintaining aspect ratio
    let (orig_width, orig_height) = image.dimensions();
    let scale = max_width as f32 / orig_width as f32;
    let new_width = max_width;
    let new_height = (orig_height as f32 * scale) as u32;

    // Resize the image
    let dynamic_image = image::DynamicImage::ImageRgba8(image);
    let resized = dynamic_image.resize(new_width, new_height, image::imageops::FilterType::Triangle);
    let rgb_image = resized.to_rgb8();

    let mut buffer = Cursor::new(Vec::new());
    let encoder = JpegEncoder::new_with_quality(&mut buffer, 60);
    encoder
        .write_image(&rgb_image, new_width, new_height, image::ExtendedColorType::Rgb8)
        .map_err(|e| e.to_string())?;

    Ok(BASE64.encode(buffer.into_inner()))
}
