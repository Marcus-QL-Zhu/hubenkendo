export default function CoverPage({ canContinue, onContinue, onStart, sourceUrl }) {
  return (
    <main className="app-shell cover-page">
      <section className="cover-hero">
        <div className="cover-badge">AI Prompt Builder</div>
        <h1>女友Maker</h1>
        <p>点选参考图，快速拼出 AI 女友角色 Prompt</p>
        <button className="primary-button start-button" type="button" onClick={onStart}>
          立即开始
        </button>
        {canContinue ? (
          <button className="ghost-button" type="button" onClick={onContinue}>
            继续上次选择
          </button>
        ) : null}
      </section>

      <footer className="source-footer">
        <span>素材整理自 Draco正在VibeCoding</span>
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          查看原文
        </a>
      </footer>
    </main>
  );
}
