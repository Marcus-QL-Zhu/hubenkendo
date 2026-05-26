import { useEffect, useMemo, useState } from 'react';
import CoverPage from './components/CoverPage.jsx';
import StepPage from './components/StepPage.jsx';
import ResultPage from './components/ResultPage.jsx';
import { buildPrompts } from './lib/promptBuilder.js';
import { hasSelections, toggleSelection } from './lib/selection.js';
import { loadSelection, saveSelection } from './lib/storage.js';

const SOURCE_URL = 'https://mp.weixin.qq.com/s/sf_epNebyrKJD-mmOu0mcA';
const IMAGE_URL = 'https://ai.mikuapi.org/?invite_code=QNCW6';

export default function App() {
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [screen, setScreen] = useState('cover');
  const [stepIndex, setStepIndex] = useState(0);
  const [selection, setSelection] = useState(() => loadSelection());

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}catalog.json`)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(setCatalog)
      .catch((error) => setLoadError(error.message));
  }, []);

  useEffect(() => {
    saveSelection(selection);
  }, [selection]);

  const prompts = useMemo(
    () => (catalog ? buildPrompts(catalog, selection) : { zh: '角色设定：', en: 'Character:' }),
    [catalog, selection]
  );

  if (loadError) {
    return (
      <main className="app-shell center-shell">
        <section className="empty-state">
          <h1>素材加载失败</h1>
          <p>请确认 catalog.json 和图片资源已经生成。</p>
          <code>{loadError}</code>
        </section>
      </main>
    );
  }

  if (!catalog) {
    return (
      <main className="app-shell center-shell">
        <section className="empty-state">
          <h1>女友Maker</h1>
          <p>正在整理素材...</p>
        </section>
      </main>
    );
  }

  const totalSteps = catalog.sections.length + 1;
  const currentSection = catalog.sections[stepIndex];
  const canContinue = hasSelections(selection);

  function startFlow(index = 0) {
    setStepIndex(index);
    setScreen('step');
  }

  function startNewFlow() {
    setSelection({});
    startFlow(0);
  }

  function updateSelection(section, itemId) {
    setSelection((current) => toggleSelection(current, section, itemId));
  }

  function goNext() {
    if (stepIndex >= totalSteps - 1) {
      setScreen('result');
      return;
    }
    setStepIndex((index) => index + 1);
  }

  function goPrevious() {
    if (stepIndex === 0) {
      setScreen('cover');
      return;
    }
    setStepIndex((index) => index - 1);
  }

  if (screen === 'cover') {
    return (
      <CoverPage
        canContinue={canContinue}
        onContinue={() => startFlow(stepIndex)}
        onStart={startNewFlow}
        sourceUrl={SOURCE_URL}
      />
    );
  }

  if (screen === 'result') {
    return (
      <ResultPage
        catalog={catalog}
        imageUrl={IMAGE_URL}
        onEdit={(index) => startFlow(index)}
        prompts={prompts}
        selection={selection}
        sourceUrl={SOURCE_URL}
        totalSteps={totalSteps}
      />
    );
  }

  return (
    <StepPage
      currentIndex={stepIndex}
      onJump={setStepIndex}
      onNext={goNext}
      onPrevious={goPrevious}
      onShowResult={() => setScreen('result')}
      onToggle={updateSelection}
      section={currentSection}
      sections={catalog.sections}
      selectedIds={selection[currentSection.id] || []}
      selection={selection}
      totalSteps={totalSteps}
    />
  );
}
