import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  sanitizeFilename,
  triggerDownload,
  downloadBlob,
  downloadText,
  downloadJSON,
  generateTimestamp,
} from "../../utils/downloadUtils";

describe("sanitizeFilename", () => {
  it("strips path separators and illegal characters", () => {
    expect(sanitizeFilename("a/b/c.csv")).toBe("a_b_c.csv");
    expect(sanitizeFilename("bad:name?.csv")).toBe("bad_name_.csv");
    expect(sanitizeFilename("C:\\temp\\report.pdf")).toBe("C__temp_report.pdf");
  });

  it("collapses whitespace and trims dots", () => {
    expect(sanitizeFilename("  event   report.csv  ")).toBe("event report.csv");
    expect(sanitizeFilename("...")).toBe("download");
  });

  it("falls back for empty input", () => {
    expect(sanitizeFilename("")).toBe("download");
    expect(sanitizeFilename(null)).toBe("download");
    expect(sanitizeFilename(null, "export")).toBe("export");
  });
});

describe("triggerDownload", () => {
  let anchorClick;
  let createObjectURL;
  let revokeObjectURL;

  beforeEach(() => {
    anchorClick = vi.fn();
    createObjectURL = vi.fn(() => "blob:mock-url");
    revokeObjectURL = vi.fn();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;

    document.createElement = vi.fn((tag) => {
      const element = {
        tagName: tag.toUpperCase(),
        href: "",
        download: "",
        style: {},
        click: anchorClick,
      };
      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a hidden anchor, clicks it and cleans up the URL", () => {
    const blob = new Blob(["data"], { type: "text/plain" });
    triggerDownload(blob, "export.txt");

    expect(createObjectURL).toHaveBeenCalledWith(blob);
    expect(anchorClick).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
  });

  it("sanitizes unsafe filenames before download", () => {
    triggerDownload(new Blob(["x"]), "a/b.csv");
    const anchor = document.createElement("a");
    expect(anchor.download).toBe("a_b.csv");
  });
});

describe("downloadBlob / downloadText", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    document.createElement = vi.fn(() => ({ style: {}, click: vi.fn() }));
  });

  afterEach(() => vi.restoreAllMocks());

  it("builds a blob with the expected mime type", () => {
    downloadText("hello", "note.txt");
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("text/plain;charset=utf-8");
  });

  it("respects a custom mime type", () => {
    downloadBlob('{"a":1}', "data.json", "application/json;charset=utf-8");
    const blob = URL.createObjectURL.mock.calls[0][0];
    expect(blob.type).toBe("application/json;charset=utf-8");
  });
});

describe("downloadJSON", () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => "blob:mock-url");
    URL.revokeObjectURL = vi.fn();
    document.createElement = vi.fn(() => ({ style: {}, click: vi.fn() }));
  });

  afterEach(() => vi.restoreAllMocks());

  it("serialises and pretty-prints the payload", () => {
    downloadJSON({ a: 1, b: [1, 2] }, "export.json");
    const blob = URL.createObjectURL.mock.calls[0][0];
    const text = blob.text();
    return expect(text).resolves.toBe(
      '{\n  "a": 1,\n  "b": [\n    1,\n    2\n  ]\n}\n'
    );
  });
});

describe("generateTimestamp", () => {
  it("formats a compact YYYYMMDD-HHmm timestamp", () => {
    const now = new Date(2025, 7, 3, 14, 30);
    expect(generateTimestamp(now)).toBe("20250803-1430");
  });

  it("pads single-digit components", () => {
    const now = new Date(2025, 0, 5, 9, 5);
    expect(generateTimestamp(now)).toBe("20250105-0905");
  });
});
