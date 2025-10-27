// utils/slugifyUnique.js
function baseSlugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80);
}
async function slugifyUnique(base, getBySlugFn) {
  const root = baseSlugify(base);
  let candidate = root || "test";
  let i = 1;
  while (await getBySlugFn(candidate)) {
    i += 1;
    candidate = `${root}-${i}`;
  }
  return candidate;
}
module.exports = { slugifyUnique };
