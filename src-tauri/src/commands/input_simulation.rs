use enigo::{
    Button, Coordinate, Direction, Enigo, Key, Keyboard, Mouse, Settings,
};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

static ENIGO: once_cell::sync::Lazy<Mutex<Enigo>> = once_cell::sync::Lazy::new(|| {
    Mutex::new(Enigo::new(&Settings::default()).expect("Failed to create Enigo instance"))
});

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyModifiers {
    pub shift: bool,
    pub control: bool,
    pub alt: bool,
    pub meta: bool,
}

impl Default for KeyModifiers {
    fn default() -> Self {
        Self {
            shift: false,
            control: false,
            alt: false,
            meta: false,
        }
    }
}

#[tauri::command]
pub fn mouse_move(x: i32, y: i32) -> Result<(), String> {
    let mut enigo = ENIGO.lock();
    enigo
        .move_mouse(x, y, Coordinate::Abs)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mouse_click(button: u8) -> Result<(), String> {
    let btn = match button {
        0 => Button::Left,
        1 => Button::Middle,
        2 => Button::Right,
        _ => Button::Left,
    };

    let mut enigo = ENIGO.lock();
    enigo.button(btn, Direction::Click).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mouse_double_click(button: u8) -> Result<(), String> {
    let btn = match button {
        0 => Button::Left,
        1 => Button::Middle,
        2 => Button::Right,
        _ => Button::Left,
    };

    let mut enigo = ENIGO.lock();
    enigo.button(btn, Direction::Click).map_err(|e| e.to_string())?;
    enigo.button(btn, Direction::Click).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mouse_down(button: u8) -> Result<(), String> {
    let btn = match button {
        0 => Button::Left,
        1 => Button::Middle,
        2 => Button::Right,
        _ => Button::Left,
    };

    let mut enigo = ENIGO.lock();
    enigo.button(btn, Direction::Press).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mouse_up(button: u8) -> Result<(), String> {
    let btn = match button {
        0 => Button::Left,
        1 => Button::Middle,
        2 => Button::Right,
        _ => Button::Left,
    };

    let mut enigo = ENIGO.lock();
    enigo.button(btn, Direction::Release).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn mouse_scroll(direction: String, amount: i32) -> Result<(), String> {
    let mut enigo = ENIGO.lock();

    let scroll_amount = amount.abs();

    match direction.as_str() {
        "up" => enigo.scroll(scroll_amount, enigo::Axis::Vertical),
        "down" => enigo.scroll(-scroll_amount, enigo::Axis::Vertical),
        "left" => enigo.scroll(-scroll_amount, enigo::Axis::Horizontal),
        "right" => enigo.scroll(scroll_amount, enigo::Axis::Horizontal),
        _ => enigo.scroll(scroll_amount, enigo::Axis::Vertical),
    }
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn key_press(key: String, modifiers: Option<KeyModifiers>) -> Result<(), String> {
    let mut enigo = ENIGO.lock();
    let mods = modifiers.unwrap_or_default();

    // Press modifiers
    if mods.control {
        enigo.key(Key::Control, Direction::Press).map_err(|e| e.to_string())?;
    }
    if mods.shift {
        enigo.key(Key::Shift, Direction::Press).map_err(|e| e.to_string())?;
    }
    if mods.alt {
        enigo.key(Key::Alt, Direction::Press).map_err(|e| e.to_string())?;
    }
    if mods.meta {
        enigo.key(Key::Meta, Direction::Press).map_err(|e| e.to_string())?;
    }

    // Press the key
    let key_enum = string_to_key(&key);
    enigo.key(key_enum, Direction::Click).map_err(|e| e.to_string())?;

    // Release modifiers in reverse order
    if mods.meta {
        enigo.key(Key::Meta, Direction::Release).map_err(|e| e.to_string())?;
    }
    if mods.alt {
        enigo.key(Key::Alt, Direction::Release).map_err(|e| e.to_string())?;
    }
    if mods.shift {
        enigo.key(Key::Shift, Direction::Release).map_err(|e| e.to_string())?;
    }
    if mods.control {
        enigo.key(Key::Control, Direction::Release).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn key_down(key: String) -> Result<(), String> {
    let mut enigo = ENIGO.lock();
    let key_enum = string_to_key(&key);
    enigo.key(key_enum, Direction::Press).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn key_up(key: String) -> Result<(), String> {
    let mut enigo = ENIGO.lock();
    let key_enum = string_to_key(&key);
    enigo.key(key_enum, Direction::Release).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn type_text(text: String) -> Result<(), String> {
    let mut enigo = ENIGO.lock();
    enigo.text(&text).map_err(|e| e.to_string())
}

fn string_to_key(key: &str) -> Key {
    match key.to_lowercase().as_str() {
        // Letters
        "a" => Key::Unicode('a'),
        "b" => Key::Unicode('b'),
        "c" => Key::Unicode('c'),
        "d" => Key::Unicode('d'),
        "e" => Key::Unicode('e'),
        "f" => Key::Unicode('f'),
        "g" => Key::Unicode('g'),
        "h" => Key::Unicode('h'),
        "i" => Key::Unicode('i'),
        "j" => Key::Unicode('j'),
        "k" => Key::Unicode('k'),
        "l" => Key::Unicode('l'),
        "m" => Key::Unicode('m'),
        "n" => Key::Unicode('n'),
        "o" => Key::Unicode('o'),
        "p" => Key::Unicode('p'),
        "q" => Key::Unicode('q'),
        "r" => Key::Unicode('r'),
        "s" => Key::Unicode('s'),
        "t" => Key::Unicode('t'),
        "u" => Key::Unicode('u'),
        "v" => Key::Unicode('v'),
        "w" => Key::Unicode('w'),
        "x" => Key::Unicode('x'),
        "y" => Key::Unicode('y'),
        "z" => Key::Unicode('z'),

        // Numbers
        "0" | "digit0" => Key::Unicode('0'),
        "1" | "digit1" => Key::Unicode('1'),
        "2" | "digit2" => Key::Unicode('2'),
        "3" | "digit3" => Key::Unicode('3'),
        "4" | "digit4" => Key::Unicode('4'),
        "5" | "digit5" => Key::Unicode('5'),
        "6" | "digit6" => Key::Unicode('6'),
        "7" | "digit7" => Key::Unicode('7'),
        "8" | "digit8" => Key::Unicode('8'),
        "9" | "digit9" => Key::Unicode('9'),

        // Function keys
        "f1" => Key::F1,
        "f2" => Key::F2,
        "f3" => Key::F3,
        "f4" => Key::F4,
        "f5" => Key::F5,
        "f6" => Key::F6,
        "f7" => Key::F7,
        "f8" => Key::F8,
        "f9" => Key::F9,
        "f10" => Key::F10,
        "f11" => Key::F11,
        "f12" => Key::F12,

        // Special keys
        "enter" | "return" => Key::Return,
        "escape" | "esc" => Key::Escape,
        "backspace" => Key::Backspace,
        "tab" => Key::Tab,
        "space" | " " => Key::Space,
        "delete" | "del" => Key::Delete,
        "insert" | "ins" => Key::Insert,
        "home" => Key::Home,
        "end" => Key::End,
        "pageup" | "page_up" => Key::PageUp,
        "pagedown" | "page_down" => Key::PageDown,

        // Arrow keys
        "arrowup" | "up" => Key::UpArrow,
        "arrowdown" | "down" => Key::DownArrow,
        "arrowleft" | "left" => Key::LeftArrow,
        "arrowright" | "right" => Key::RightArrow,

        // Modifier keys
        "shift" | "shiftleft" | "shiftright" => Key::Shift,
        "control" | "ctrl" | "controlleft" | "controlright" => Key::Control,
        "alt" | "altleft" | "altright" => Key::Alt,
        "meta" | "metaleft" | "metaright" | "command" | "cmd" | "win" | "windows" => Key::Meta,
        "capslock" | "caps" => Key::CapsLock,

        // Punctuation and symbols
        "minus" | "-" => Key::Unicode('-'),
        "equal" | "=" => Key::Unicode('='),
        "bracketleft" | "[" => Key::Unicode('['),
        "bracketright" | "]" => Key::Unicode(']'),
        "backslash" | "\\" => Key::Unicode('\\'),
        "semicolon" | ";" => Key::Unicode(';'),
        "quote" | "'" => Key::Unicode('\''),
        "backquote" | "`" => Key::Unicode('`'),
        "comma" | "," => Key::Unicode(','),
        "period" | "." => Key::Unicode('.'),
        "slash" | "/" => Key::Unicode('/'),

        // Numpad
        "numpad0" => Key::Unicode('0'),
        "numpad1" => Key::Unicode('1'),
        "numpad2" => Key::Unicode('2'),
        "numpad3" => Key::Unicode('3'),
        "numpad4" => Key::Unicode('4'),
        "numpad5" => Key::Unicode('5'),
        "numpad6" => Key::Unicode('6'),
        "numpad7" => Key::Unicode('7'),
        "numpad8" => Key::Unicode('8'),
        "numpad9" => Key::Unicode('9'),
        "numpadadd" | "numpadplus" => Key::Unicode('+'),
        "numpadsubtract" | "numpadminus" => Key::Unicode('-'),
        "numpadmultiply" | "numpadasterisk" => Key::Unicode('*'),
        "numpaddivide" | "numpadslash" => Key::Unicode('/'),
        "numpaddecimal" | "numpadperiod" => Key::Unicode('.'),
        "numpadenter" => Key::Return,

        // Print screen, scroll lock, pause
        "printscreen" | "print" => Key::Print,
        "scrolllock" => Key::ScrollLock,
        "pause" => Key::Pause,

        // Default: try to use first character
        _ => {
            if let Some(c) = key.chars().next() {
                Key::Unicode(c)
            } else {
                Key::Space
            }
        }
    }
}

#[tauri::command]
pub fn mouse_move_relative(dx: i32, dy: i32) -> Result<(), String> {
    let mut enigo = ENIGO.lock();
    enigo
        .move_mouse(dx, dy, Coordinate::Rel)
        .map_err(|e| e.to_string())
}
