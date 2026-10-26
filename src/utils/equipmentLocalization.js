const equipmentNames = {
  'Smith Machine': { uk: 'машина Сміта' },
  barbell: { uk: 'штанга' },
  bench: { uk: 'лава' },
  box: { uk: 'пліометричний бокс' },
  'cable machine': { uk: 'блочний тренажер' },
  dumbbells: { uk: 'гантелі' },
  kettlebell: { uk: 'гиря' },
  'leg press': { uk: 'тренажер для жиму ногами' },
  machine: { uk: 'тренажер' },
  'parallel bars': { uk: 'паралельні бруси' },
  platform: { uk: 'платформа' },
  'pull-up bar': { uk: 'турнік' },
  'resistance band': { uk: 'резинова стрічка' },
  rope: { uk: 'канатна рукоять' },
  't-bar': { uk: 'Т-гриф' },
};

export function localizeEquipment(value, locale) {
  return locale === 'uk' ? equipmentNames[value]?.uk || value : value;
}

export function exerciseEquipment(exercise) {
  const structured = exercise?.equipmentStructured;
  if (structured) {
    return {
      required: structured.required || [],
      alternatives: structured.alternatives || [],
    };
  }
  return { required: exercise?.equipment || [], alternatives: [] };
}
