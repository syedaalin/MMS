import { describe, expect, it } from "vitest";
import { parsePhoneNumber, normalizeToE164 } from "./utils.js";

describe("parsePhoneNumber", () => {
  it("parses E.164 with space separator", () => {
    expect(parsePhoneNumber("+92 300 1234567")).toEqual({
      countryCode: "+92",
      number: "300 1234567",
    });
  });

  it("returns default code for bare local number", () => {
    expect(parsePhoneNumber("03001234567", "+92")).toEqual({
      countryCode: "+92",
      number: "03001234567",
    });
  });

  it("handles empty input", () => {
    expect(parsePhoneNumber("", "+1")).toEqual({ countryCode: "+1", number: "" });
  });
});

describe("normalizeToE164", () => {
  it("combines country code and local number", () => {
    expect(normalizeToE164("+92", "300-1234567")).toBe("+923001234567");
  });

  it("strips leading zero from local part", () => {
    expect(normalizeToE164("+92", "03001234567")).toBe("+923001234567");
  });
});
