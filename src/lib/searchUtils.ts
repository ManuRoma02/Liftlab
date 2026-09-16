export const normalizeSearchText = (value = "") =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

export const fuzzyScore = (query: string, target: string) => {
  const q = normalizeSearchText(query);
  const t = normalizeSearchText(target);
  if (!q) return 1;
  if (!t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length > 1 && tokens.every((token) => t.includes(token))) return 50;

  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti += 1) {
    if (t[ti] === q[qi]) qi += 1;
  }
  return qi === q.length ? 20 : 0;
};
