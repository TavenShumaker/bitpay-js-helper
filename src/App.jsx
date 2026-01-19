import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'

const MODE = window.BITPAY_MODE || 'local';
const IS_LOCAL = MODE === 'local';
const API_ORIGIN = IS_LOCAL ? 'https://tshumaker.bp:8088' : 'https://bitpay.com';

// Expected events from BitPay.js
const EXPECTED_EVENTS = [
  { key: 'onModalWillEnter', label: 'onModalWillEnter', type: 'callback', description: 'Modal is about to open' },
  { key: 'loaded', label: 'loaded', type: 'postMessage', description: 'Invoice has loaded' },
  { key: 'onModalWillLeave', label: 'onModalWillLeave', type: 'callback', description: 'Modal is about to close' },
  { key: 'close', label: 'close', type: 'postMessage', description: 'User closed the modal' },
];

function App() {
  const [price, setPrice] = useState(1);
  const [currency, setCurrency] = useState('USD');
  const [invoiceId, setInvoiceId] = useState('');
  const [events, setEvents] = useState([]);
  const [receivedEvents, setReceivedEvents] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Listen for postMessage events from bitpay.js
  useEffect(() => {
    // Only accept messages from trusted BitPay origins
    const trustedOrigins = [API_ORIGIN, 'https://bitpay.com'];

    const handleMessage = (event) => {
      // Ignore messages from untrusted origins
      if (!trustedOrigins.includes(event.origin)) {
        return;
      }

      // Log all messages for debugging
      const timestamp = new Date().toLocaleTimeString();
      const dataStr = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
      setEvents(prev => [...prev, { timestamp, origin: event.origin, data: dataStr }]);

      // Track received events for checklist
      const eventKey = typeof event.data === 'string' ? event.data : event.data?.status;
      if (eventKey) {
        setReceivedEvents(prev => new Set([...prev, eventKey]));
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Configure bitpay.js and register callbacks
  useEffect(() => {
    if (window.bitpay) {
      // Point bitpay.js to appropriate server
      if (IS_LOCAL) {
        window.bitpay.setApiUrlPrefix(API_ORIGIN);
      }

      window.bitpay.onModalWillEnter(() => {
        setEvents(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          origin: 'callback',
          data: 'onModalWillEnter'
        }]);
        setReceivedEvents(prev => new Set([...prev, 'onModalWillEnter']));
      });
      window.bitpay.onModalWillLeave(() => {
        setEvents(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          origin: 'callback',
          data: 'onModalWillLeave'
        }]);
        setReceivedEvents(prev => new Set([...prev, 'onModalWillLeave']));
      });
    }
  }, []);

  const showInvoice = async () => {
    setLoading(true);
    setEvents([]);
    try {
      const response = await axios.post('http://localhost:8000/api/invoices', {
        price,
        currency,
      });

      console.log('response', response);
      const id = response.data?.data?.id;
      setInvoiceId(id);
      window.bitpay.showInvoice(id);

      console.log('Invoice created:', id);
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.response.data.error);
      } else {
        console.error('Request failed:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Open invoice by ID (for testing existing invoices)
  const showExistingInvoice = () => {
    if (invoiceId) {
      setEvents([]);
      window.bitpay.showInvoice(invoiceId);
    }
  };

  const clearEvents = () => {
    setEvents([]);
    setReceivedEvents(new Set());
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>BitPay.js Test Helper</h1>
      <div style={{
        marginBottom: '20px',
        padding: '10px 15px',
        borderRadius: '8px',
        background: IS_LOCAL ? '#2d4a2d' : '#4a2d4a',
        color: '#fff',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>Mode: <strong>{IS_LOCAL ? 'Local Dev' : 'Production'}</strong> ({API_ORIGIN})</span>
        <a
          href={IS_LOCAL ? '/prod.html' : '/index.html'}
          style={{ color: '#fff', textDecoration: 'underline' }}
        >
          Switch to {IS_LOCAL ? 'Production' : 'Local Dev'}
        </a>
      </div>

      <section style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Create Invoice</h2>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <label>
            Price:
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              style={{ marginLeft: '5px', width: '80px' }}
            />
          </label>
          <label>
            Currency:
            <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ marginLeft: '5px' }}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="BTC">BTC</option>
            </select>
          </label>
        </div>
        <button onClick={showInvoice} disabled={!window.bitpay || loading}>
          {loading ? 'Creating...' : 'Create & Show Invoice'}
        </button>
      </section>

      <section style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Open Existing Invoice</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Invoice ID"
            value={invoiceId}
            onChange={(e) => setInvoiceId(e.target.value)}
            style={{ flex: 1 }}
          />
          <button onClick={showExistingInvoice} disabled={!window.bitpay || !invoiceId}>
            Open Invoice
          </button>
        </div>
      </section>

      <section style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h2>Expected Events Checklist</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {EXPECTED_EVENTS.map((evt) => {
            const isReceived = receivedEvents.has(evt.key);
            return (
              <div
                key={evt.key}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: isReceived ? '#1a3d1a' : '#2a2a2a',
                  border: `2px solid ${isReceived ? '#4caf50' : '#555'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{
                  fontSize: '20px',
                  width: '24px',
                  textAlign: 'center'
                }}>
                  {isReceived ? '✓' : '○'}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold', color: isReceived ? '#4caf50' : '#aaa' }}>
                    {evt.label}
                  </div>
                  <div style={{ fontSize: '11px', color: '#888' }}>
                    {evt.type} — {evt.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
          {receivedEvents.size} of {EXPECTED_EVENTS.length} expected events received
        </div>
      </section>

      <section style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Event Log</h2>
          <button onClick={clearEvents} style={{ fontSize: '12px' }}>Clear All</button>
        </div>
        <div style={{
          background: '#1a1a1a',
          color: '#0f0',
          padding: '10px',
          borderRadius: '4px',
          maxHeight: '300px',
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {events.length === 0 ? (
            <div style={{ color: '#666' }}>No events yet. Open an invoice to see postMessage events.</div>
          ) : (
            events.map((event, i) => (
              <div key={i} style={{ marginBottom: '5px' }}>
                <span style={{ color: '#888' }}>[{event.timestamp}]</span>{' '}
                <span style={{ color: '#ff0' }}>{event.origin}</span>:{' '}
                <span>{event.data}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section style={{ marginTop: '20px', padding: '15px', background: '#1a1a1a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Status</h3>
        <div>bitpay.js loaded: {window.bitpay ? '✓' : '✗'}</div>
        <div>API origin: {API_ORIGIN}</div>
        <div>Last invoice ID: {invoiceId || 'none'}</div>
      </section>
    </div>
  );
}

export default App
