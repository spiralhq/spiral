import { describe, it, expect } from "vitest";
import { LOCALES, type Locale } from "./locales";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.resolve(__dirname, "..", "..");
const messagesDir = path.join(projectRoot, "messages");

describe("LOCALES", () => {
  it("contains 'en' and 'pt-BR'", () => {
    const values = LOCALES.map((l) => l.value);
    expect(values).toContain("en");
    expect(values).toContain("pt-BR");
  });

  it("each locale has a value and label", () => {
    for (const locale of LOCALES) {
      expect(typeof locale.value).toBe("string");
      expect(typeof locale.label).toBe("string");
      expect(locale.value.length).toBeGreaterThan(0);
      expect(locale.label.length).toBeGreaterThan(0);
    }
  });

  it("values are valid Locale type members", () => {
    const valid: Locale[] = ["en", "pt-BR"];
    for (const locale of LOCALES) {
      expect(valid).toContain(locale.value);
    }
  });

  it("each locale has a corresponding messages JSON file", () => {
    for (const locale of LOCALES) {
      const filePath = path.join(messagesDir, `${locale.value}.json`);
      expect(existsSync(filePath)).toBe(true);
    }
  });
});
