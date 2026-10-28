// A plain progress bar; value is 0–1.
export function Progress({ value }: { value: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(value * 100)}>
      <div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} />
    </div>
  )
}
