export function isLastSelectionStep(stepIndex, sectionCount) {
  return stepIndex >= sectionCount - 1;
}

export function nextWizardTarget(stepIndex, sectionCount) {
  if (isLastSelectionStep(stepIndex, sectionCount)) {
    return { screen: 'result', stepIndex };
  }

  return { screen: 'step', stepIndex: stepIndex + 1 };
}
