import assert from 'node:assert/strict';
import test from 'node:test';
import { exerciseEquipment, localizeEquipment } from '../src/utils/equipmentLocalization.js';

test('equipment names localize without changing canonical stored values', () => {
  assert.equal(localizeEquipment('barbell', 'uk'), 'штанга');
  assert.equal(localizeEquipment('barbell', 'en'), 'barbell');
  assert.equal(localizeEquipment('custom sled', 'uk'), 'custom sled');
});

test('structured alternatives stay separate from jointly required equipment', () => {
  assert.deepEqual(
    exerciseEquipment({
      equipmentStructured: {
        required: ['bench'],
        alternatives: [['barbell', 'dumbbells']],
      },
    }),
    { required: ['bench'], alternatives: [['barbell', 'dumbbells']] },
  );
  assert.deepEqual(exerciseEquipment({ equipment: ['rope'] }), {
    required: ['rope'],
    alternatives: [],
  });
});
