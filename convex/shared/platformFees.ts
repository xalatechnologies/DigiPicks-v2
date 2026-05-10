// =============================================================================
// Platform fee model — single source of truth.
//
// Used by Earnings UI projections, future payout calculations, and any
// dashboard surface that estimates "creator take" from gross MRR.
//
// 13% rolls up roughly:
//   - 10% DigiPicks platform fee
//   - ~3% Stripe processing
//
// Override in production via PLATFORM_FEE_RATE_BPS (basis points). The
// env-var path lets ops tweak without redeploying app code.
// =============================================================================

export const DEFAULT_PLATFORM_FEE_RATE = 0.13;

export function getPlatformFeeRate(): number {
  const bps = Number(process.env.PLATFORM_FEE_RATE_BPS);
  if (Number.isFinite(bps) && bps >= 0 && bps <= 10000) {
    return bps / 10000;
  }
  return DEFAULT_PLATFORM_FEE_RATE;
}
