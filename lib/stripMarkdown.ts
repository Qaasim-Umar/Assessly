// Plain-text version of a Markdown string, for meta/OG descriptions and any
// place that needs the words without the formatting symbols.
export function stripMarkdown(md: string): string {
  return md
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")      // images
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")   // links → keep text
    .replace(/[*_~`>#-]/g, "")                  // emphasis / heading / quote markers
    .replace(/\s+/g, " ")
    .trim();
}
