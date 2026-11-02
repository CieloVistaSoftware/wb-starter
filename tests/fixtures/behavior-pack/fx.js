// A stand-in for a WB Pro module, used by behavior-pack-registration.spec.ts.
export function packsparkle(element) {
  element.dataset.packsparkle = 'applied';
  return () => {};
}
