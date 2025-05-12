import React from 'react';
import axios from 'axios';
import './App.css'

function App() {

  const showInvoice = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/invoices', {
        price: 1,
        currency: 'USD',
      });

      console.log('response', response);
      window.bitpay.showInvoice(response.data?.data?.id)

      console.log('Invoice created:', response.data.data.id);
    } catch (error) {
      if (error.response) {
        console.error('Error:', error.response.data.error);
      } else {
        console.error('Request failed:', error.message);
      }
    }
  }

  return (
    <>
      <div>This App is to test BitPay.js</div>
      <p>When you click the button below a few things happen</p>
      <ul>
        <li>An api call is made to create a bitpay invoice</li>
        <li>bitpay.showInvoice(invoiceId) is called</li>
        <li>Invoice is displayed</li>
      </ul>
      <p>The popup should not be blocked because the button click directly calls the invoice popup to open</p>
      <button onClick={showInvoice} disabled={!window.bitpay}>Show Invoice</button>
    </>
  )
}

export default App
