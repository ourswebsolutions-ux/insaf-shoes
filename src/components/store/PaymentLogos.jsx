// Simple wordmark badges for accepted payment methods.
export default function PaymentLogos() {
  return (
    <div className="pay-logos">
      <span className="pay-logo" title="JazzCash">
        <svg width="62" height="18" viewBox="0 0 62 18" aria-label="JazzCash">
          <text x="0" y="14" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="13" fill="#d71f26" fontStyle="italic">Jazz</text>
          <text x="29" y="14" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="13" fill="#f2b705" fontStyle="italic">Cash</text>
        </svg>
      </span>
      <span className="pay-logo" title="Easypaisa">
        <svg width="64" height="18" viewBox="0 0 64 18" aria-label="Easypaisa">
          <text x="0" y="13" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="12.5" fill="#1aa260">easypaisa</text>
        </svg>
      </span>
      <span className="pay-logo" title="Visa">
        <svg width="42" height="16" viewBox="0 0 42 16" aria-label="Visa">
          <text x="0" y="14" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="16" fill="#1a1f71" fontStyle="italic">VISA</text>
        </svg>
      </span>
      <span className="pay-logo" title="Mastercard">
        <svg width="34" height="22" viewBox="0 0 34 22" aria-label="Mastercard">
          <circle cx="12" cy="11" r="9" fill="#eb001b" />
          <circle cx="22" cy="11" r="9" fill="#f79e1b" fillOpacity=".9" />
        </svg>
      </span>
    </div>
  );
}
