use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
    pub machine_id: String,
    pub hostname: String,
    pub platform: String,
    pub arch: String,
}

#[tauri::command]
pub fn get_machine_id() -> Result<String, String> {
    machine_uid::get().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_hostname() -> Result<String, String> {
    hostname::get()
        .map_err(|e| e.to_string())
        .and_then(|h| h.into_string().map_err(|_| "Invalid hostname".to_string()))
}

#[tauri::command]
pub fn get_platform() -> String {
    #[cfg(target_os = "windows")]
    return "windows".to_string();

    #[cfg(target_os = "macos")]
    return "macos".to_string();

    #[cfg(target_os = "linux")]
    return "linux".to_string();

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    return "unknown".to_string();
}

#[tauri::command]
pub fn get_arch() -> String {
    #[cfg(target_arch = "x86_64")]
    return "x86_64".to_string();

    #[cfg(target_arch = "aarch64")]
    return "aarch64".to_string();

    #[cfg(target_arch = "x86")]
    return "x86".to_string();

    #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64", target_arch = "x86")))]
    return "unknown".to_string();
}

#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        machine_id: get_machine_id()?,
        hostname: get_hostname()?,
        platform: get_platform(),
        arch: get_arch(),
    })
}

#[tauri::command]
pub fn hash_password(password: String) -> Result<String, String> {
    bcrypt::hash(&password, bcrypt::DEFAULT_COST).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn verify_password(password: String, hash: String) -> Result<bool, String> {
    bcrypt::verify(&password, &hash).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn generate_connection_id(use_machine_id: bool) -> Result<String, String> {
    if use_machine_id {
        // Generate ID based on machine ID
        let machine_id = get_machine_id()?;
        let hash = format!("{:x}", md5::compute(machine_id.as_bytes()));
        // Take first 9 digits from the hex hash converted to number
        let numeric: String = hash
            .chars()
            .filter_map(|c| c.to_digit(16))
            .map(|d| std::char::from_digit(d % 10, 10).unwrap())
            .take(9)
            .collect();

        if numeric.len() == 9 {
            Ok(numeric)
        } else {
            // Fallback to random if not enough digits
            generate_random_id()
        }
    } else {
        generate_random_id()
    }
}

fn generate_random_id() -> Result<String, String> {
    use std::time::{SystemTime, UNIX_EPOCH};

    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_nanos();

    let uuid = uuid::Uuid::new_v4();
    let combined = format!("{}{}", now, uuid);
    let hash = format!("{:x}", md5::compute(combined.as_bytes()));

    let numeric: String = hash
        .chars()
        .filter_map(|c| c.to_digit(16))
        .map(|d| std::char::from_digit(d % 10, 10).unwrap())
        .take(9)
        .collect();

    if numeric.len() >= 9 {
        Ok(numeric[..9].to_string())
    } else {
        // Simple fallback
        let random_part: String = (0..9)
            .map(|_| std::char::from_digit(rand::random::<u32>() % 10, 10).unwrap())
            .collect();
        Ok(random_part)
    }
}
