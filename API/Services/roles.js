const ORDERED_ROLES = ["SuperAdmin", "Admin", "Teacher", "Student"];

function pickHighestRole(groups = []) {
  const s = new Set(groups);
  for (const r of ORDERED_ROLES) if (s.has(r)) return r;
  return "Student";
}

module.exports = { ORDERED_ROLES, pickHighestRole };
