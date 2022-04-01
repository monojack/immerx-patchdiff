export const diff = (() =>
  (typeof Symbol === 'function' && Symbol.for('ImmerPatchDiff')) ||
  '@@ImmerPatchDiff')()
