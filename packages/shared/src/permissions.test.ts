import { describe, expect, it } from "vitest";
import { roleHasPermission } from "./permissions.js";

describe("roleHasPermission", () => {
  it("grants admin full settings write", () => {
    expect(roleHasPermission("admin", "settings.branding.write")).toBe(true);
    expect(roleHasPermission("admin", "users.manage")).toBe(true);
  });

  it("denies teacher user management", () => {
    expect(roleHasPermission("teacher", "users.manage")).toBe(false);
    expect(roleHasPermission("teacher", "students.write")).toBe(true);
  });

  it("grants accountant finance write", () => {
    expect(roleHasPermission("accountant", "finance.write")).toBe(true);
    expect(roleHasPermission("accountant", "settings.branding.write")).toBe(false);
  });

  it("denies accountant enrollments.write", () => {
    expect(roleHasPermission("accountant", "enrollments.write")).toBe(false);
  });

  it("grants teacher enrollments.write", () => {
    expect(roleHasPermission("teacher", "enrollments.write")).toBe(true);
  });
});
