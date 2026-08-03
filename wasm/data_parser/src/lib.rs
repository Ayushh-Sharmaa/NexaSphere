use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct TelemetryEvent {
    timestamp: i64,
    event_type: String,
    value: f64,
}

#[derive(Serialize, Deserialize)]
struct AggregationResult {
    total_events: usize,
    average_value: f64,
    max_value: f64,
    min_value: f64,
}

#[wasm_bindgen]
pub fn aggregate_telemetry(raw_json: &str) -> String {
    // Parse the massive JSON string using serde_json
    let events: Vec<TelemetryEvent> = match serde_json::from_str(raw_json) {
        Ok(data) => data,
        Err(_) => return String::from("{\"error\": \"Failed to parse JSON\"}"),
    };

    if events.is_empty() {
        return String::from("{\"error\": \"No events found\"}");
    }

    let mut sum = 0.0;
    let mut max = f64::MIN;
    let mut min = f64::MAX;

    for event in &events {
        sum += event.value;
        if event.value > max {
            max = event.value;
        }
        if event.value < min {
            min = event.value;
        }
    }

    let result = AggregationResult {
        total_events: events.len(),
        average_value: sum / (events.len() as f64),
        max_value: max,
        min_value: min,
    };

    // Serialize the result back to a JSON string for JS
    serde_json::to_string(&result).unwrap_or_else(|_| String::from("{\"error\": \"Failed to serialize\"}"))
}
