const HELD = new Set();
const PRESSED = [];
const WATCHED = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Enter',
  'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'KeyQ', 'KeyF', 'KeyC', 'KeyM', 'KeyR',
  'ShiftLeft', 'ShiftRight',
]);

export function initInput() {
  window.addEventListener('keydown', (e) => {
    if (!WATCHED.has(e.code)) return;
    e.preventDefault();
    if (!HELD.has(e.code)) PRESSED.push(e.code);
    HELD.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    HELD.delete(e.code);
  });
  window.addEventListener('blur', () => HELD.clear());
}

export function axis() {
  let x = 0;
  let y = 0;
  if (HELD.has('KeyA') || HELD.has('ArrowLeft')) x -= 1;
  if (HELD.has('KeyD') || HELD.has('ArrowRight')) x += 1;
  if (HELD.has('KeyW') || HELD.has('ArrowUp')) y -= 1;
  if (HELD.has('KeyS') || HELD.has('ArrowDown')) y += 1;
  const m = Math.hypot(x, y) || 1;
  return { x: x / m, y: y / m, any: x !== 0 || y !== 0 };
}

export function sneaking() {
  return HELD.has('ShiftLeft') || HELD.has('ShiftRight');
}

export function holding() {
  return HELD.has('KeyE');
}

export function pressed(code) {
  const i = PRESSED.indexOf(code);
  if (i >= 0) {
    PRESSED.splice(i, 1);
    return true;
  }
  return false;
}

export function clearPressed() {
  PRESSED.length = 0;
}
