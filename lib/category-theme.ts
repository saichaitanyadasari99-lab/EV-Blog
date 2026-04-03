export function getCategoryTone(category?: string | null) {
  const key = (category ?? "post").toLowerCase();

  if (key === "news") return "#00d8f2";
  if (key === "benchmark") return "#ff6b35";
  if (key === "deep-dive") return "#7c3aed";
  if (key === "review") return "#00d68f";
  if (key === "standards") return "#ffd60a";
  return "#00d8f2";
}
