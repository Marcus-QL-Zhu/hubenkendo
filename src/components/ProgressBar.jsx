export default function ProgressBar({ current, total }) {
  const percent = Math.round((current / total) * 100);
  const remaining = Math.max(total - current, 0);

  return (
    <div className="progress-wrap" aria-label={`进度 ${current} / ${total}`}>
      <div className="progress-meta">
        <span>{current} / {total}</span>
        <span>{remaining === 0 ? '最后一步' : `还差 ${remaining} 步`}</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
