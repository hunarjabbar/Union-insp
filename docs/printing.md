# Thermal Receipt Printing — Union Inspection

## Supported hardware

| Vendor | Model       | Connection | Paper   | Notes                        |
|--------|-------------|------------|---------|------------------------------|
| Epson  | TM-T20III   | USB        | 58/80mm | Reference profile (default)  |
| Epson  | TM-T88VI    | USB        | 80mm    | High-volume lanes            |
| Star   | TSP100      | USB        | 80mm    | Alternate vendor             |
| Generic| ESC/POS     | USB        | 58/80mm | Any ESC/POS-compatible printer|

## Connection options

| Method      | Browser support          | Trade-off                                    |
|-------------|--------------------------|----------------------------------------------|
| WebUSB      | Chrome/Edge desktop only | Requires user gesture; fastest; recommended  |
| Web Serial  | Chrome (Windows fallback)| Slightly slower; bypasses driver conflicts   |
| Network TCP | Any browser via server   | Requires server-side print bridge            |
| Bluetooth   | Chrome (Android)         | Works on mobile POS terminals                |
| PDF share   | All browsers (fallback)  | iPad/Firefox path; uses navigator.share()    |

## QR error correction

Level **H** (30% recovery) is used because thermal paper smudges easily
and windshield stickers degrade within 6–12 months.

## Reprint policy

- Maximum 3 reprints per receipt.
- Every reprint requires a reason ≥ 10 characters.
- Every reprint writes an immutable `RECEIPT_REPRINTED` audit log entry.
- Reprint count is displayed in the UI and in the audit portal.

## Paper specification

- Width: 80mm (fits defect list, QR, and payment line on one page)
- Roll: 80mm × 80mm, BPA-free thermal paper
- Max roll diameter: 83mm (standard Epson TM-T20III holder)

## Operator workflow

1. Ensure printer is powered on and loaded with paper.
2. Chrome will prompt for WebUSB access on first use per device.
3. Permissions are remembered for the session via
   `localStorage['union.printer.<id>']`.
4. If the printer becomes unresponsive, click "Reconnect" in the Topbar
   printer indicator.
