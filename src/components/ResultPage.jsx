import { useRef, useState } from 'react';
import ProgressBar from './ProgressBar.jsx';
import { copyText as copyToClipboard, selectElementText } from '../lib/copyText.js';

function PromptBox({ label, text }) {
  const [copyState, setCopyState] = useState('idle');
  const promptRef = useRef(null);

  async function copyText() {
    const copiedSuccessfully = await copyToClipboard(text);
    if (copiedSuccessfully) {
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1400);
      return;
    }

    if (selectElementText(promptRef.current)) {
      setCopyState('selected');
      window.setTimeout(() => setCopyState('idle'), 2200);
      return;
    }

    setCopyState('manual');
  }

  const buttonText = {
    idle: '复制',
    copied: '已复制',
    selected: '已选中',
    manual: '手动复制'
  }[copyState];

  return (
    <section className="prompt-box">
      <div className="prompt-title">
        <h2>{label}</h2>
        <button className="secondary-button small" type="button" onClick={copyText}>
          {buttonText}
        </button>
      </div>
      <pre ref={promptRef}>{text}</pre>
      {copyState === 'selected' ? <p className="copy-hint">浏览器限制了自动复制，文本已选中。</p> : null}
    </section>
  );
}

export default function ResultPage({ catalog, imageUrl, onEdit, prompts, sourceUrl, totalSteps }) {
  return (
    <main className="app-shell result-page">
      <header className="result-header">
        <p className="eyebrow">Prompt Ready</p>
        <h1>完成啦</h1>
        <p>复制任意一版 Prompt，去 GPT image 2 直接出图。</p>
        <ProgressBar current={totalSteps} total={totalSteps} />
      </header>

      <PromptBox label="中文 Prompt" text={prompts.zh} />
      <PromptBox label="English Prompt" text={prompts.en} />

      <div className="result-actions">
        <a className="primary-button link-button" href={imageUrl}>
          打开 GPT image 2
        </a>
        <button className="secondary-button" type="button" onClick={() => onEdit(0)}>
          返回修改
        </button>
      </div>

      <section className="edit-list">
        {catalog.sections.map((section, index) => (
          <button key={section.id} type="button" onClick={() => onEdit(index)}>
            {section.titleZh}
          </button>
        ))}
      </section>

      <footer className="source-footer in-flow">
        <span>素材整理自 Draco正在VibeCoding</span>
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          查看原文
        </a>
      </footer>
    </main>
  );
}
