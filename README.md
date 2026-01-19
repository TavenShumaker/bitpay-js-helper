# BitPay.js Test Helper

A local development tool for testing BitPay.js merchant integrations. Simulates a merchant checkout flow by creating invoices and displaying them via `bitpay.showInvoice()`.

## Setup

```bash
npm install
npm start
```

This runs both the backend server (port 8000) and the Vite frontend (port 5173).

## Configuration

Currently configured to point to local BitPay development:

| Setting | Value |
|---------|-------|
| bitpay.js source | `https://tshumaker.bp:8088/bitpay.min.js` |
| Invoice API | `https://tshumaker.bp:8088/invoices` |
| API Token | Configured in `server.js` |

To switch environments, update:
- `index.html` - bitpay.js script source
- `server.js` - Invoice API URL and token

## Features

- **Create Invoice** - Configurable price and currency
- **Open Existing Invoice** - Test any invoice by ID
- **Event Log** - Real-time display of:
  - postMessage events from the invoice
  - `onModalWillEnter` / `onModalWillLeave` callbacks
- **Status Panel** - Shows bitpay.js load status

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Run backend + frontend together |
| `npm run dev` | Run frontend only (Vite) |
| `npm run server` | Run backend only (Express) |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser (localhost:5173)                               │
│  ┌───────────────────────────────────────────────────┐  │
│  │  React App                                        │  │
│  │  - Calls backend to create invoice                │  │
│  │  - Calls window.bitpay.showInvoice(id)            │  │
│  │  - Listens for postMessage events                 │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                              │
           │ POST /api/invoices           │ postMessage
           ▼                              ▼
┌─────────────────────┐       ┌─────────────────────────┐
│  Express Backend    │       │  BitPay Invoice         │
│  (localhost:8000)   │       │  (popup window)         │
│  - Proxies to       │       │  - Sends 'loaded'       │
│    BitPay API       │       │  - Sends 'close'        │
└─────────────────────┘       └─────────────────────────┘
           │
           │ POST /invoices
           ▼
┌─────────────────────┐
│  BitPay API         │
│  (tshumaker.bp:8088)│
└─────────────────────┘
```
