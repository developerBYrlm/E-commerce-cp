function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !key.startsWith("$") && !key.includes(".") && key !== "__proto__" && key !== "constructor")
      .map(([key, child]) => [key, sanitize(child)]));
  }
  return value;
}

export function sanitizeInput(req, _res, next) {
  if (req.body && typeof req.body === "object") req.body = sanitize(req.body);
  next();
}
