export function getCategoryTone(category?: string | null) {
  const key = (category ?? "post").toLowerCase();

  if (key === "news") return "#00d8f2";
  if (key === "benchmark" || key === "ev-benchmarks") return "#ff6b35";
  if (key === "deep-dive" || key === "bms-design") return "#7c3aed";
  if (key === "review" || key === "vehicle-reviews") return "#00d68f";
  if (key === "post" || key === "cell-chemistry") return "#00d8f2";
  if (key === "standards") return "#ffd60a";
  return "#00d8f2";
}
