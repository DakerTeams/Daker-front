function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = []
  const delta = 2
  const left = Math.max(0, page - delta)
  const right = Math.min(totalPages - 1, page + delta)

  for (let i = left; i <= right; i++) {
    pages.push(i)
  }

  return (
    <div className="pagination">
      <button
        type="button"
        className="pagination__btn"
        disabled={page === 0}
        onClick={() => onChange(page - 1)}
      >
        ‹
      </button>

      {left > 0 && (
        <>
          <button type="button" className="pagination__btn" onClick={() => onChange(0)}>1</button>
          {left > 1 && <span className="pagination__ellipsis">…</span>}
        </>
      )}

      {pages.map((p) => (
        <button
          key={p}
          type="button"
          className={`pagination__btn${p === page ? ' pagination__btn--active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}

      {right < totalPages - 1 && (
        <>
          {right < totalPages - 2 && <span className="pagination__ellipsis">…</span>}
          <button type="button" className="pagination__btn" onClick={() => onChange(totalPages - 1)}>
            {totalPages}
          </button>
        </>
      )}

      <button
        type="button"
        className="pagination__btn"
        disabled={page === totalPages - 1}
        onClick={() => onChange(page + 1)}
      >
        ›
      </button>
    </div>
  )
}

export default Pagination
