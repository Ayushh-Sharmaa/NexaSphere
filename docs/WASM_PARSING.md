# WebAssembly (Wasm) for Heavy Client-Side Data Parsing

We use a Rust-compiled WebAssembly module to unblock the JavaScript main thread when parsing and aggregating massive (50MB+) JSON telemetry payloads in the Analytics Dashboard.

## Why Wasm?

Parsing massive arrays of objects in V8 (JavaScript) triggers heavy Garbage Collection pauses and locks the main thread, resulting in a frozen UI.
Rust compiles down to a minimal Wasm binary that executes at near-native speed directly in the browser, passing only the final, aggregated lightweight result back to JavaScript.

## Setup & Build

You will need Rust and \`wasm-pack\` installed on your machine.

1. Navigate to the Rust project:
   \`cd wasm/data_parser\`
2. Build the Wasm target for web:
   \`wasm-pack build --target web --out-dir ../../src/wasm/pkg\`

Alternatively, run the NPM script from the root:
\`npm run build:wasm\`

## Usage in React

Use the \`useWasmParser\` hook to dynamically load the WebAssembly binary and execute it.
See \`src/hooks/useWasmParser.js\` for the implementation details.
