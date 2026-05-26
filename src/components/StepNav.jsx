import { useRef } from 'react';
import { useHorizontalWheel } from '../hooks/useHorizontalWheel.js';

export default function StepNav({ currentIndex, onJump, sections, selection }) {
  const stepNavRef = useRef(null);
  useHorizontalWheel(stepNavRef);

  return (
    <nav className="step-nav" ref={stepNavRef} aria-label="步骤导航">
      {sections.map((section, index) => {
        const selectedCount = (selection[section.id] || []).length;
        return (
          <button
            className={index === currentIndex ? 'step-pill active' : 'step-pill'}
            key={section.id}
            type="button"
            onClick={() => onJump(index)}
          >
            <span>{section.titleZh}</span>
            {selectedCount > 0 ? <strong>{selectedCount}</strong> : null}
          </button>
        );
      })}
    </nav>
  );
}
