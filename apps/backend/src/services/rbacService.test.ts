import { describe, expect, it } from "vitest";
import type { User } from "@mms/shared";
import { canBulkSync, canWriteCollection, canWriteObject } from "./rbacService.js";

const admin: User = { id: "1", email: "a@test.com", name: "Admin", role: "admin", workspaceSubdomain: "demo" };
const teacher: User = { id: "2", email: "t@test.com", name: "Teacher", role: "teacher", workspaceSubdomain: "demo" };
const accountant: User = { id: "3", email: "c@test.com", name: "Acct", role: "accountant", workspaceSubdomain: "demo" };

describe("rbacService", () => {
  it("restricts users collection to admin", () => {
    expect(canWriteCollection(admin, "users")).toBe(true);
    expect(canWriteCollection(teacher, "users")).toBe(false);
  });

  it("allows write roles on general collections", () => {
    expect(canWriteCollection(teacher, "students")).toBe(true);
    expect(canWriteCollection(accountant, "students")).toBe(true);
  });

  it("restricts branding to admin", () => {
    expect(canWriteObject(admin, "branding")).toBe(true);
    expect(canWriteObject(accountant, "branding")).toBe(false);
  });

  it("restricts bulk sync to admin", () => {
    expect(canBulkSync(admin)).toBe(true);
    expect(canBulkSync(teacher)).toBe(false);
  });
});
