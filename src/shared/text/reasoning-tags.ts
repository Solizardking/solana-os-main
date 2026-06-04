export type StripReasoningOptions = {
  mode?: "preserve" | "strip";
  trim?: "start" | "both" | "none";
};

const PAIRED_TAG_RE = /<(think|thinking)>[\s\S]*?<\/\1>\n*/g;
const FINAL_WRAP_RE = /<final>\n?([\s\S]*?)<\/final>/g;
const ORPHAN_CLOSE_RE = /<\/(think|thinking|final)>/g;

export function stripReasoningTagsFromText(
  text: string,
  opts?: StripReasoningOptions,
): string {
  const trim = opts?.trim ?? "none";

  let result = text;

  // Strip paired <think>…</think> and <thinking>…</thinking> blocks
  result = result.replace(PAIRED_TAG_RE, "");

  // Unwrap <final>…</final> to just its inner content
  result = result.replace(FINAL_WRAP_RE, "$1");

  // Remove orphaned closing tags
  result = result.replace(ORPHAN_CLOSE_RE, "");

  // Handle unpaired opening tags — strip the tag line but keep content after
  result = result.replace(/^<(think|thinking)>\n?/gm, "");

  if (trim === "start" || trim === "both") {
    result = result.replace(/^\n+/, "");
  }
  if (trim === "both") {
    result = result.replace(/\n+$/, "");
  }

  return result;
}
