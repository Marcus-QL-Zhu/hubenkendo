const baseUrl = import.meta.env.BASE_URL;

export default function TileGrid({ items, onToggle, selectedIds }) {
  return (
    <div className="tile-grid">
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <button
            className={selected ? 'tile-card selected' : 'tile-card'}
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
          >
            <img alt={`${item.zh} / ${item.en}`} loading="lazy" src={`${baseUrl}${item.image}`} />
            <span className="tile-label-zh">{item.zh}</span>
            <span className="tile-label-en">{item.en}</span>
          </button>
        );
      })}
    </div>
  );
}
