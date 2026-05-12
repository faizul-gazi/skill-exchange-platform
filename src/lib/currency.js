export function formatBDT(value) {
  const amount = Number(value ?? 0)
  if (!Number.isFinite(amount)) return 'BDT 0'
  if (amount === 0) return 'Free'
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(amount)
}

