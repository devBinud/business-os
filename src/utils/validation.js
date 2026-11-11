export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());

/**
 * Validate a form object against simple rules.
 * rules: { field: [ [predicate, message], ... ] }
 * Returns an object of field -> first error message (empty object when valid).
 */
export function validate(values, rules) {
  const errors = {};
  for (const [field, checks] of Object.entries(rules)) {
    for (const [ok, message] of checks) {
      if (!ok(values[field], values)) {
        errors[field] = message;
        break;
      }
    }
  }
  return errors;
}

export const required = (msg = 'This field is required') => [
  (v) => v !== undefined && v !== null && String(v).trim() !== '',
  msg,
];

export const positiveNumber = (msg = 'Enter an amount greater than 0') => [
  (v) => Number(v) > 0,
  msg,
];

export const nonNegativeInt = (msg = 'Enter a whole number of 0 or more') => [
  (v) => Number.isInteger(Number(v)) && Number(v) >= 0,
  msg,
];

export const optionalEmail = (msg = 'Enter a valid email address') => [
  (v) => !v || isEmail(v),
  msg,
];

export const email = (msg = 'Enter a valid email address') => [(v) => isEmail(v || ''), msg];
