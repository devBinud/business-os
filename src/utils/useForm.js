import { useCallback, useState } from 'react';
import { validate } from './validation.js';

/**
 * Minimal form state helper.
 * const f = useForm(initial, rules);  f.values, f.errors, f.set(field)(event|value), f.submit(onValid)
 */
export function useForm(initial, rules = {}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});

  const setValue = useCallback((field, value) => {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }, []);

  const set = (field) => (eventOrValue) => {
    const value =
      eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue
        ? eventOrValue.target.type === 'checkbox'
          ? eventOrValue.target.checked
          : eventOrValue.target.value
        : eventOrValue;
    setValue(field, value);
  };

  const submit = (onValid) => {
    const found = validate(values, rules);
    setErrors(found);
    if (Object.keys(found).length === 0) onValid(values);
  };

  const reset = (next) => {
    setValues(next);
    setErrors({});
  };

  /** Props for an input/select/textarea bound to `field`. `base` is the control's CSS class. */
  const bind = (field, base = 'input') => ({
    value: values[field] ?? '',
    onChange: set(field),
    className: errors[field] ? `${base} invalid` : base,
    'aria-invalid': errors[field] ? true : undefined,
  });

  return { values, errors, set, setValue, setValues, submit, reset, bind };
}
