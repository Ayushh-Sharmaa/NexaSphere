import assert from "assert";

function computeVirtualWindow(scrollTop, totalItems, rowHeight = 40, containerHeight = 400, buffer = 5) {
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const end = Math.min(totalItems, start + visibleCount + buffer * 2);
  const offsetY = start * rowHeight;
  return { start, end, visibleCount: end - start, offsetY };
}

function runTests() {
  console.log("Running Virtualized Metrics Table Index Calculation Tests...");

  // Test 1: Initial scroll at top (scrollTop = 0)
  const window0 = computeVirtualWindow(0, 1000, 40, 400, 5);
  assert.strictEqual(window0.start, 0);
  assert.strictEqual(window0.offsetY, 0);
  assert.strictEqual(window0.visibleCount, 20); // 10 visible + 10 buffer

  // Test 2: Scrolled down (scrollTop = 800 -> 20 rows down)
  const window800 = computeVirtualWindow(800, 1000, 40, 400, 5);
  assert.strictEqual(window800.start, 15); // 20 - 5 buffer
  assert.strictEqual(window800.offsetY, 600); // 15 * 40

  console.log("All Virtualized Metrics Table tests passed successfully!");
}

runTests();
