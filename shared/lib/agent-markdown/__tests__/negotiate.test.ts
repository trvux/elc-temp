import { describe, expect, it } from "vitest";
import { prefersMarkdown } from "@/shared/lib/agent-markdown/negotiate";

describe("prefersMarkdown", () => {
  it.each([
    ["text/markdown", true],
    ["text/markdown, text/html;q=0.9", true],
    ["text/markdown;q=0.9, text/html;q=0.5", true],
    ["text/markdown, text/html", true], // tie -> listed first wins
    ["TEXT/Markdown", true],
  ])("%s -> markdown", (accept, expected) => {
    expect(prefersMarkdown(accept)).toBe(expected);
  });

  it.each([
    [null],
    [undefined],
    [""],
    ["*/*"],
    ["text/html"],
    ["text/html, text/markdown"], // tie -> html listed first
    ["text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"], // browser
    ["text/markdown;q=0, text/html"], // explicit refusal
    ["text/markdown;q=0.5, text/html"],
    ["application/json"],
  ])("%s -> html", (accept) => {
    expect(prefersMarkdown(accept)).toBe(false);
  });
});
