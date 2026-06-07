// WISEcon27 — real QR badge. The prototype shipped a decorative faux-QR;
// per the handoff this encodes the actual badge id so it scans at the door.
import { QRCodeSVG } from 'qrcode.react'

export function QR({ value, size = 200 }: { value: string; size?: number }) {
  return (
    <QRCodeSVG
      value={value}
      size={size}
      level="M"
      bgColor="#ffffff"
      fgColor="#111111"
      style={{ display: 'block', borderRadius: 2 }}
    />
  )
}
