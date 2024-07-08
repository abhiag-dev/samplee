import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const EditInvoice = () => {
  const { InvoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    axios
      .get(`https://backendserver-52a3.onrender.com/invoices/${InvoiceNumber}`)
      .then((response) => setInvoice(response.data))
      .catch((error) =>
        console.error("There was an error fetching the invoice!", error)
      );

    axios
      .get("https://backendserver-52a3.onrender.com/customers")
      .then((response) => setCustomers(response.data))
      .catch((error) =>
        console.error("There was an error fetching the customers!", error)
      );
  }, [InvoiceNumber]);

  const [formData, setFormData] = useState({
    date: "",
    invoiceNumber: "",
    CustomerName: "",
    vehicleNumber: "",
    itemName1: "",
    item1Quantity: "",
    item1Rate: "",
    item1Total: "",
    itemName2: "",
    item2Quantity: "",
    item2Rate: "",
    item2Total: 0,
    freight: "",
    invoiceValue: "",
  });

  useEffect(() => {
    if (invoice) {
      setFormData({
        date: invoice.date || "",
        invoiceNumber: invoice.invoiceNumber || "",
        CustomerName: invoice.CustomerName || "",
        vehicleNumber: invoice.vehicleNumber || "",
        itemName1: invoice.itemName1 || "",
        item1Quantity: invoice.item1Quantity || "",
        item1Rate: invoice.item1Rate || "",

        itemName2: invoice.itemName2 || "",
        item2Quantity: invoice.item2Quantity || "",
        item2Rate: invoice.item2Rate || "",

        freight: invoice.freight || "",
        invoiceValue: invoice.invoiceValue || "",
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
  const handleDelete = async () => {
    try {
      await axios.delete(
        `https://backendserver-52a3.onrender.com/invoices/delete/${InvoiceNumber}`
      );
      alert("Invoice deleted successfully!");
      // history.push("/invoices"); // Redirect to invoices list or another route
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Failed to delete invoice. Please try again.");
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(
        `https://backendserver-52a3.onrender.com/invoices/${InvoiceNumber}`,
        formData
      )
      .then((response) => {
        setInvoice(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.error("Error updating invoice:", formData);
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
            <label>Invoice Number:</label>
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Customer Name:</label>
            <select
              name="CustomerName"
              value={formData.CustomerName}
              onChange={handleChange}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.CustomerName}>
                  {customer.CustomerName}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Vehicle Number:</label>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Item Name 1:</label>
            <input
              type="text"
              name="itemName1"
              value={formData.itemName1}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Item 1 Quantity:</label>
            <input
              type="number"
              name="item1Quantity"
              value={formData.item1Quantity}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Item 1 Rate:</label>
            <input
              type="number"
              name="item1Rate"
              value={formData.item1Rate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Item Name 2:</label>
            <input
              type="text"
              name="itemName2"
              value={formData.itemName2}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Item 2 Quantity:</label>
            <input
              type="number"
              name="item2Quantity"
              value={formData.item2Quantity}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Item 2 Rate:</label>
            <input
              type="number"
              name="item2Rate"
              value={formData.item2Rate}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Freight:</label>
            <input
              type="number"
              name="freight"
              value={formData.freight}
              onChange={handleChange}
            />
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
          <button onClick={handleDelete}>Delete Invoice</button>
        </form>
      )}
    </div>
  );
};

export default EditInvoice;
