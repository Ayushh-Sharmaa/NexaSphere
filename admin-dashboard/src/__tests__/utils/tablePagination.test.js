import { describe, expect, test } from "vitest";
import {
  sortData,
  filterData,
  paginateData,
  applyTableState,
} from "../../utils/tablePagination";

const users = [
  { id: 1, name: "Alice", role: "Developer", age: 25 },
  { id: 2, name: "Bob", role: "Designer", age: 30 },
  { id: 3, name: "Charlie", role: "Developer", age: 22 },
  { id: 4, name: "David", role: "Manager", age: 35 },
];

describe("sortData", () => {
  test("sorts numbers in ascending order", () => {
    const result = sortData(users, "age", "asc");

    expect(result.map((user) => user.age)).toEqual([22, 25, 30, 35]);
  });

  test("sorts numbers in descending order", () => {
    const result = sortData(users, "age", "desc");

    expect(result.map((user) => user.age)).toEqual([35, 30, 25, 22]);
  });

  test("sorts strings case-insensitively", () => {
    const result = sortData(users, "name", "asc");

    expect(result.map((user) => user.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
      "David",
    ]);
  });

  test("does not mutate the original array", () => {
    const original = [...users];

    sortData(users, "age", "desc");

    expect(users).toEqual(original);
  });

  test("handles empty and null input", () => {
    expect(sortData([], "name")).toEqual([]);
    expect(sortData(null, "name")).toEqual([]);
  });
});

describe("filterData", () => {
  test("matches search across multiple columns", () => {
    const result = filterData(users, "developer", ["name", "role"]);

    expect(result.map((user) => user.name)).toEqual(["Alice", "Charlie"]);
  });

  test("is case-insensitive", () => {
    const result = filterData(users, "ALICE", ["name"]);

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Alice");
  });

  test("returns all data when search term is empty", () => {
    const result = filterData(users, "", ["name"]);

    expect(result).toEqual(users);
  });

  test("returns empty array when no columns are supplied for a search", () => {
    expect(filterData(users, "alice", [])).toEqual([]);
  });

  test("handles null input", () => {
    expect(filterData(null, "alice", ["name"])).toEqual([]);
  });
});

describe("paginateData", () => {
  test("returns the correct page", () => {
    const result = paginateData(users, 2, 2);

    expect(result.items.map((user) => user.name)).toEqual(["Charlie", "David"]);

    expect(result.totalPages).toBe(2);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(false);
  });

  test("handles the first page correctly", () => {
    const result = paginateData(users, 1, 2);

    expect(result.items.map((user) => user.name)).toEqual(["Alice", "Bob"]);

    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(true);
  });

  test("handles a page beyond the last page", () => {
    const result = paginateData(users, 10, 2);

    expect(result.items).toEqual([users[2], users[3]]);
    expect(result.totalPages).toBe(2);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(false);
  });

  test("handles empty data", () => {
    expect(paginateData([], 1, 10)).toEqual({
      items: [],
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });

  test("handles null data", () => {
    expect(paginateData(null, 1, 10)).toEqual({
      items: [],
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });
});

describe("applyTableState", () => {
  test("filters, sorts, and paginates in one call", () => {
    const result = applyTableState(users, {
      sortKey: "age",
      sortDir: "desc",
      search: "developer",
      columns: ["role"],
      page: 1,
      pageSize: 1,
    });

    expect(result.items).toEqual([
      {
        id: 1,
        name: "Alice",
        role: "Developer",
        age: 25,
      },
    ]);

    expect(result.totalPages).toBe(2);
    expect(result.hasNext).toBe(true);
    expect(result.hasPrev).toBe(false);
  });

  test("handles empty state", () => {
    expect(
      applyTableState([], {
        sortKey: "name",
        sortDir: "asc",
        search: "test",
        columns: ["name"],
        page: 1,
        pageSize: 10,
      })
    ).toEqual({
      items: [],
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });
});
