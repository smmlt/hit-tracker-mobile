// EN: Maps API profile values into editable strings and resets the form when a different profile snapshot arrives.
// UK: Перетворює значення API-профілю на редаговані рядки та скидає форму після отримання іншого знімка профілю.
import { useEffect, useState } from 'react';

const toForm = (profile = {}) => ({
  displayName: profile.displayName || profile.username || '',
  email: profile.email || '',
  age: profile.age?.toString() || '',
  height: profile.height?.toString() || '',
  weight: profile.weight?.toString() || '',
  gender: profile.gender || 'female',
  goal: profile.goal || '',
});

const numberOrUndefined = (value) => (value === '' ? undefined : Number(value));

export function useProfileForm(profile, onSave) {
  const [form, setForm] = useState(() => toForm(profile));

  useEffect(() => setForm(toForm(profile)), [profile]);

  const setField = (field) => (value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = () => onSave({
    displayName: form.displayName.trim(),
    email: form.email.trim(),
    age: numberOrUndefined(form.age),
    height: numberOrUndefined(form.height),
    weight: numberOrUndefined(form.weight),
    gender: form.gender,
    goal: form.goal.trim() || undefined,
  });

  return { form, setField, submit };
}
