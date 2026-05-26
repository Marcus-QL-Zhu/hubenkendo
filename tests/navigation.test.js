import { describe, expect, it } from 'vitest';
import { isLastSelectionStep, nextWizardTarget } from '../src/lib/navigation.js';

describe('wizard navigation', () => {
  it('treats the last catalog section as the last selectable step even when result is counted in progress', () => {
    expect(isLastSelectionStep(6, 7)).toBe(true);
    expect(isLastSelectionStep(5, 7)).toBe(false);
  });

  it('routes from the last selectable step to the result screen', () => {
    expect(nextWizardTarget(6, 7)).toEqual({ screen: 'result', stepIndex: 6 });
    expect(nextWizardTarget(5, 7)).toEqual({ screen: 'step', stepIndex: 6 });
  });
});
