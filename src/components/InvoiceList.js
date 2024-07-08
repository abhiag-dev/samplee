// src/components/InvoiceList.js
import React, { useEffect, useState } from "react";
import axios from "axios";

import { Link, useNavigate } from "react-router-dom";
import "../css/InvoiceList.css";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(
        "https://backendserver-52a3.onrender.com/invoices/list"
      );
      setInvoices(response.data);
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  const handleViewPDF = (invoiceNumber) => {
    navigate(`/view-invoice/${invoiceNumber}`, {
      state: { generatePDF: true },
    });
  };

  return (
    <div className="container1">
      <div className="list-header">
        <h2>Invoice List</h2>
        <Link to="/addinvoice" className="add-customer-button">
          Add Invoice
        </Link>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>
              Invoice
              <br /> No.
            </th>
            <th>Customer Name</th>
            <th>Invoice Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{new Date(invoice.date).toLocaleDateString("en-GB")}</td>
              <td>{invoice.invoiceNumber}</td>
              <td>{invoice.CustomerName}</td>
              <td>{invoice.invoiceValue}</td>
              {/* <td> */}
              <div className="dropdown">
                {/* <button className="dropbtn">Actions</button> */}
                <div className="dropdown-content">
                  <Link to={`/edit-invoice/${invoice.invoiceNumber}`}>
                    Edit Invoice
                  </Link>
                  <Link to={`/view-invoice/${invoice.invoiceNumber}`}>
                    View Invoice
                  </Link>
                  <button onClick={() => handleViewPDF(invoice.invoiceNumber)}>
                    View PDF
                  </button>
                </div>
              </div>
              {/* </td> */}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InvoiceList;
