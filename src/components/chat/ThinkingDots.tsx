/**
 * Lightweight loading indicator shown while assistant is generating a response.
 */
export function ThinkingDots() {
  return (
    <div className="flex justify-start">
      <div
        aria-label="WISMO đang suy nghĩ"
        className="max-w-[85%] inline-flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 shadow-sm"
        role="status"
      >
        <span className="sr-only">WISMO đang suy nghĩ</span>
        {[0, 1, 2].map((index) => (
          <span
            aria-hidden="true"
            className="h-2.5 w-2.5 animate-pulse rounded-full"
            key={index}
            style={{
              animationDelay: `${index * 150}ms`,
              backgroundColor: 'var(--color-wismo-primary)',
              opacity: 0.7,
            }}
          />
        ))}
      </div>
    </div>
  )
}
