# BitPay.js Integration Testing - Project Context

## Projects Overview

This workspace involves three related projects for BitPay's JavaScript payment integration:

### 1. bitpay-js-helper (This Directory)
**Location**: `/Users/tshumaker/dev/test-helpers/bitpay-js-helper`

A local development/testing tool for debugging BitPay.js merchant integrations.

**Current State**:
- React frontend (Vite) + Express backend
- Creates test invoices and displays them via BitPay modal
- Logs postMessage and callback events
- Has expected events checklist (onModalWillEnter, loaded, onModalWillLeave, close)
- Two HTML entry points: `index.html` (local dev) and `prod.html` (production)

**Key Files**:
- `src/App.jsx` - Main React component with invoice creation and event logging
- `server.js` - Express backend that proxies invoice creation to BitPay API
- `index.html` / `prod.html` - Entry points for different environments

---

### 2. bitpay.js (The Library)
**Location**: `/Users/tshumaker/dev/bitpay/client/static/apps/bitpay-js/bitpay.js`

Lightweight JavaScript library merchants embed on their sites to display BitPay invoices.

**Current Branch Enhancements** (not the original master):
- **Iframe removed** - replaced with a styled `<div>` overlay (blur backdrop, BitPay logo, status messages)
- **Popup-only flow** - `showInvoice()` opens popup window, overlay provides visual context
- **Better popup-blocked handling** - overlay message updates, "Open Payment Window" button
- **New `destroy()`/`close()` method** - returns Promise, cleans up listeners and references
- **Preserves original body overflow** - stores and restores instead of assuming 'auto'
- **Removed `setButtonListeners()`** - legacy broken code that auto-attached to forms

**API Exposed to Merchants**:
```javascript
window.bitpay.showInvoice(id, params)  // Show invoice in popup + overlay
window.bitpay.onModalWillEnter(cb)     // Callback when overlay appears
window.bitpay.onModalWillLeave(cb)     // Callback when overlay hides
window.bitpay.enableTestMode(bool)     // Switch to test.bitpay.com
window.bitpay.setApiUrlPrefix(url)     // Override API origin
window.bitpay.destroy() / .close()     // Clean up (new)
window.bitpay.showFrame() / hideFrame() // Legacy aliases
```

**PostMessage Communication**:
- Listens for messages from BitPay origin only
- `'loaded'` → shows overlay (triggers onModalWillEnter)
- `'close'` → hides overlay (triggers onModalWillLeave)
- `{ status: '...' }` → forwarded for merchant to handle
- `{ open: 'bitcoin:...' }` → handles payment URI deep links

---

### 3. invoice-v4 (The Invoice UI)
**Location**: `/Users/tshumaker/dev/bitpay/client/static/apps/invoice-v4`

React/TypeScript SPA that renders inside the bitpay.js popup. This is what users see when paying.

**Tech Stack**:
- React 18 + TypeScript + Redux Toolkit
- Vite build, styled-components
- Wagmi/Viem for EVM wallets, Solana adapters
- WalletConnect, Aave, Uniswap integrations

**Key Features**:
- Multi-wallet support (50+ wallets)
- Multiple currencies (BTC, ETH, Polygon, Solana, stablecoins)
- DApp payments, Aave lending integration
- Real-time payment tracking via SSE

**Communication with bitpay.js**:
- Sends `postMessage('loaded')` when ready → triggers overlay display
- Sends `postMessage('close')` when done → triggers overlay hide
- Detects bitpay.js via `source=bpjs` query param
- Uses `view=modal` param when opened from bitpay.js

**Key Files**:
- `src/utils/helperMethods.ts` - `postMessageFromInvoice()` function
- `src/store/app/app.thunks.ts` - App init, sends 'loaded' message
- `src/store/invoice/invoice.thunks/invoice.thunks.ts` - Invoice handling

---

## How They Relate

```
Merchant Site
    │
    └── includes bitpay.js (from bitpay.com/bitpay.min.js)
            │
            ├── merchant calls: window.bitpay.showInvoice('ABC123')
            │
            ├── bitpay.js shows overlay (div with logo + "Payment in progress...")
            │
            └── bitpay.js opens popup loading:
                    │
                    └── invoice-v4 app (/invoice?id=ABC123&source=bpjs&view=modal)
                            │
                            ├── sends postMessage('loaded') → bitpay.js shows overlay
                            ├── user selects wallet/currency, completes payment
                            └── sends postMessage('close') → bitpay.js hides overlay
```

**bitpay-js-helper** sits outside this flow as a testing harness - it loads bitpay.js, creates test invoices via API, and logs all events to verify integration works.

---

## Future Enhancement Plan

A detailed plan exists at `/Users/tshumaker/.claude/plans/typed-toasting-neumann.md` for enhancing bitpay-js-helper with:
- Railway/Render deployment
- Dynamic script loading (prod/test/custom origins)
- Full E2E merchant simulation
- Security policy simulation (popup blockers, CSP)
- Developer-specific localStorage config

---

## Common Tasks

**Run bitpay-js-helper locally**:
```bash
cd /Users/tshumaker/dev/test-helpers/bitpay-js-helper
npm start  # Runs Express (8000) + Vite (5173)
```

**Test bitpay.js changes**:
1. Modify `/Users/tshumaker/dev/bitpay/client/static/apps/bitpay-js/bitpay.js`
2. Use helper app with `setApiUrlPrefix()` pointing to local origin

**Run invoice-v4 locally**:
```bash
cd /Users/tshumaker/dev/bitpay/client/static/apps/invoice-v4
yarn dev  # Runs on port 4200
```
