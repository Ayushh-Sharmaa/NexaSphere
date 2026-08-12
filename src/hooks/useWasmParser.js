import { useState, useEffect } from 'react';

/**
 * Hook to dynamically load and utilize the Rust WebAssembly module 
 * for heavy data parsing off the main JS thread.
 */
export const useWasmParser = () => {
  const [wasmModule, setWasmModule] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Dynamically import the compiled wasm-bindgen wrapper
    const loadWasm = async () => {
      try {
        // This assumes you ran `wasm-pack build --target web` in the rust dir
        // and copied the pkg output to a discoverable path, e.g., src/wasm/pkg
        const wasm = await import('../../wasm/pkg/data_parser.js');
        await wasm.default(); // Initialize the wasm module
        setWasmModule(wasm);
        setIsReady(true);
      } catch (err) {
        console.error("Failed to load Wasm module. Did you run wasm-pack?", err);
      }
    };

    loadWasm();
  }, []);

  /**
   * Process a massive JSON string using near-native Rust speeds
   * @param {string} rawJsonString 
   * @returns {Object} Aggregated results
   */
  const processTelemetry = (rawJsonString) => {
    if (!isReady || !wasmModule) {
      throw new Error("Wasm module not ready yet.");
    }
    
    // Call the Rust function exposed via wasm-bindgen
    const resultString = wasmModule.aggregate_telemetry(rawJsonString);
    return JSON.parse(resultString);
  };

  return { isReady, processTelemetry };
};
