import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
// import "../css/EditInvoice.css";

const EditInvoice = () => {
  const { InvoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    axios
      .get(`http://localhost:3001/api/invoices/${InvoiceNumber}`)
      .then((response) => setInvoice(response.data))
      .catch((error) =>
        console.error("There was an error fetching the invoice!", error)
      );

    axios
      .get("http://localhost:3001/customers")
      .then((response) => setCustomers(response.data))
      .catch((error) =>
        console.error("There was an error fetching the customers!", error)
      );
  }, [InvoiceNumber]);

  const [formData, setFormData] = useState({
    date: "",
    type: "",
    invoiceNumber: "",
    CustomerName: "",
    invoiceValue: "",

    // dueDate: "",
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        date: invoice.date,
        type: invoice.type,
        invoiceNumber: invoice.invoiceNumber,
        CustomerName: invoice.CustomerName || "",
        invoiceValue: invoice.invoiceValue,

        // dueDate: invoice.dueDate,
      });
    }
  }, [invoice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`http://localhost:3001/invoices/${InvoiceNumber}`, formData)
      .then((response) => {
        setInvoice(response.data);
      })
      .catch((error) => {
        console.error("Error updating invoice:", error);
      });
  };

  return (
    <div className="container">
      <h2>Edit Invoice</h2>
      {invoice && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Type:</label>
            <input
              type="text"
              name="type"
              value={formData.type}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Invoice Number:</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Customer:</label>
            <select
              name="CustomerName"
              value={formData.CustomerName}
              onChange={handleChange}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option
                  key={customer.CustomerName}
                  value={customer.CustomerName}
                >
                  {customer.CustomerName}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Invoice Value:</label>
            <input
              type="number"
              name="invoiceValue"
              value={formData.invoiceValue}
              onChange={handleChange}
            />
          </div>

          <button type="submit">Update Invoice</button>
        </form>
      )}
    </div>
  );
};

export default EditInvoice;
