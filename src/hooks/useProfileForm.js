import { useEffect, useState } from 'react';

const toForm = (profile = {}) => ({
  username: profile.username || '',
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
    username: form.username.trim(),
    email: form.email.trim(),
    age: numberOrUndefined(form.age),
    height: numberOrUndefined(form.height),
    weight: numberOrUndefined(form.weight),
    gender: form.gender,
    goal: form.goal.trim() || undefined,
  });

  return { form, setField, submit };
}
