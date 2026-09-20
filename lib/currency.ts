// ─── Formateo de moneda ARS ────────────────────────────────────────────────

/**
 * Formatea un número como moneda argentina (ARS).
 * Ej: 15000 → "$15.000" | 1500.50 → "$1.500,50"
 */
export function formatARS(amount: number, showDecimals = false): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Formatea un número como porcentaje.
 * Ej: 0.12 → "12%"
 */
export function formatPercent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Aplica la regla de compensación de visita deducible.
 * Si acepta: total = presupuesto - tarifa_visita
 * Si rechaza: total = tarifa_visita
 */
export function calculateDeductibleTotal(
  quoteAmount: number,
  visitFee: number,
  accepted: boolean
): number {
  if (accepted) {
    return Math.max(0, quoteAmount - visitFee);
  }
  return visitFee;
}

/**
 * Calcula la comisión de la app sobre un cobro en efectivo.
 * @param amount Monto total del servicio
 * @param commissionRate Tasa de comisión (ej. 0.12 para 12%)
 */
export function calculateCashCommission(
  amount: number,
  commissionRate: number
): number {
  return Math.round(amount * commissionRate);
}
