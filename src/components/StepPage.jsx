import { useEffect, useMemo, useRef, useState } from 'react';
import ProgressBar from './ProgressBar.jsx';
import StepNav from './StepNav.jsx';
import TileGrid from './TileGrid.jsx';
import { isLastSelectionStep } from '../lib/navigation.js';
import { getSelectedItems } from '../lib/selection.js';

export default function StepPage({
  currentIndex,
  onJump,
  onNext,
  onPrevious,
  onShowResult,
  onToggle,
  section,
  sectionCount,
  sections,
  selectedIds,
  selection,
  totalSteps
}) {
  const [subcategoryId, setSubcategoryId] = useState('all');
  const categoryTabsRef = useRef(null);
  const selectedItems = getSelectedItems(section, selectedIds);
  const visibleItems = useMemo(() => {
    if (subcategoryId === 'all') {
      return section.subcategories.flatMap((subcategory) => subcategory.items);
    }
    return section.subcategories.find((subcategory) => subcategory.id === subcategoryId)?.items || [];
  }, [section, subcategoryId]);

  useEffect(() => {
    const element = categoryTabsRef.current;
    if (!element) return undefined;

    function handleWheel(event) {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      element.scrollLeft += event.deltaY;
    }

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <main className="app-shell tool-page">
      <header className="tool-header">
        <div>
          <p className="eyebrow">{section.selectionMode === 'single' ? '单选' : '可多选'}</p>
          <h1>{section.titleZh}</h1>
          <p>{section.titleEn}</p>
        </div>
        <ProgressBar current={currentIndex + 1} total={totalSteps} />
      </header>

      <StepNav currentIndex={currentIndex} onJump={onJump} sections={sections} selection={selection} />

      <div
        className="category-tabs"
        ref={categoryTabsRef}
        role="tablist"
        aria-label={`${section.titleZh}分类`}
      >
        <button className={subcategoryId === 'all' ? 'active' : ''} type="button" onClick={() => setSubcategoryId('all')}>
          全部
        </button>
        {section.subcategories.map((subcategory) => (
          <button
            className={subcategoryId === subcategory.id ? 'active' : ''}
            key={subcategory.id}
            type="button"
            onClick={() => setSubcategoryId(subcategory.id)}
          >
            {subcategory.titleZh}
          </button>
        ))}
      </div>

      <section className="selection-summary">
        <span>已选 {selectedItems.length}</span>
        <p>{selectedItems.length ? selectedItems.map((item) => item.zh).join('，') : '先挑一个喜欢的参考图吧'}</p>
      </section>

      <TileGrid items={visibleItems} onToggle={(itemId) => onToggle(section, itemId)} selectedIds={selectedIds} />

      <footer className="bottom-bar">
        <button className="secondary-button" type="button" onClick={onPrevious}>
          上一步
        </button>
        <button className="ghost-button compact" type="button" onClick={onShowResult}>
          Prompt
        </button>
        <button className="primary-button" type="button" onClick={onNext}>
          {isLastSelectionStep(currentIndex, sectionCount) ? '生成 Prompt' : '下一步'}
        </button>
      </footer>
    </main>
  );
}
