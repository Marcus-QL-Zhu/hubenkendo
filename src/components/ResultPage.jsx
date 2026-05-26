import { useState } from 'react';
import ProgressBar from './ProgressBar.jsx';

function PromptBox({ label, text }) {
  const [copied, setCopied] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
      window.alert('复制失败，请长按文本手动复制。');
    }
  }

  return (
    <section className="prompt-box">
      <div className="prompt-title">
        <h2>{label}</h2>
        <button className="secondary-button small" type="button" onClick={copyText}>
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre>{text}</pre>
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
        <a className="primary-button link-button" href={imageUrl} target="_blank" rel="noreferrer">
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
