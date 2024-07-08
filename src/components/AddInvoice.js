import React, { useState, useEffect } from "react";
import axios from "axios";
import "../css/EditCustomer.css"; // Import CSS file for styling
import { useNavigate } from "react-router-dom";
const AddInvoice = ({ onAddInvoice }) => {
  const history = useNavigate();
  const [formData, setFormData] = useState({
    date: "",
    invoiceNumber: "",
    CustomerName: "",
    vehicleNumber: "",
    itemName1: "",
    item1Quantity: "",
    item1Rate: "",
    item1Total: 0,
    itemName2: "",
    item2Quantity: "0",
    item2Rate: "0",
    item2Total: 0,
    freight: "0",
    invoiceValue: 0,
  });

  const [customers, setCustomers] = useState([]);
  const [lastItemsRates, setLastItemsRates] = useState([]);
  const [items, setItems] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Fetch customers from the backend
    axios
      .get("https://backendserver-52a3.onrender.com/customers")
      .then((response) => setCustomers(response.data))
      .catch((error) => console.error("Error fetching customers:", error));

    // Fetch items from the backend
    axios
      .get("https://backendserver-52a3.onrender.com/items")
      .then((response) => setItems(response.data))
      .catch((error) => console.error("Error fetching items:", error));

    // Fetch the last invoice number
    axios
      .get(
        "https://backendserver-52a3.onrender.com/invoices/last-invoice-number"
      )
      .then((response) => {
        const lastInvoiceNumber = response.data.lastInvoiceNumber || "0";
        setFormData((prevData) => ({
          ...prevData,
          invoiceNumber: (parseInt(lastInvoiceNumber, 10) + 1).toString(),
        }));
      })
      .catch((error) =>
        console.error("Error fetching last invoice number:", error)
      );
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => {
      const updatedData = {
        ...prevData,
        [name]: value,
      };

      // Calculate totals and invoice value
      const item1Total = updatedData.item1Quantity * updatedData.item1Rate || 0;
      const item2Total = updatedData.item2Quantity * updatedData.item2Rate || 0;
      const invoiceValue =
        item1Total + item2Total + parseFloat(updatedData.freight || 0);

      return {
        ...updatedData,
        item1Total,
        item2Total,
        invoiceValue,
      };
    });
    if (name === "CustomerName" && value) {
      // Fetch last items rates for the selected customer
      axios
        .get(
          `https://backendserver-52a3.onrender.com/invoices/${value}/last-items-rates`
        )
        .then((response) => setLastItemsRates(response.data))
        .catch((error) =>
          console.error("Error fetching last items rates:", error)
        );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.target
      .querySelector('button[type="submit"]')
      .setAttribute("disabled", "disabled");
    try {
      await axios.post(
        "https://backendserver-52a3.onrender.com/invoices/add",
        formData
      );

      setNotification(" Invoice added successfully:", formData);

      setTimeout(() => {
        setNotification(null); // Clear notification after 10 seconds
      }, 10000);

      setFormData({
        date: "",

        CustomerName: "",
        vehicleNumber: "",
        itemName1: "",
        item1Quantity: "",
        item1Rate: "",
        item1Total: 0,
        itemName2: "",
        item2Quantity: "0",
        item2Rate: "0",
        item2Total: 0,
        freight: "0",
        invoiceValue: 0,
      });
      history(`/view-invoice/${formData.invoiceNumber}`);
    } catch (error) {
      console.error("Error adding invoice:", error);
      setNotification("Failed to add invoice");
    } finally {
      // Enable the submit button after form submission (whether successful or not)
      e.target
        .querySelector('button[type="submit"]')
        .removeAttribute("disabled");
    }
  };

  return (
    <div className="container">
      <h2>Add Invoice</h2>
      {notification && <div className="notification">{notification}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Date:</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Invoice Number:</label>
          <input
            type="text"
            name="invoiceNumber"
            value={formData.invoiceNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Customer Name:</label>
          <select
            name="CustomerName"
            value={formData.CustomerName}
            onChange={handleChange}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.CustomerName}>
                {customer.CustomerName}
              </option>
            ))}
          </select>
        </div>
        {lastItemsRates.length > 0 && (
          <div className="last-items-rates">
            <h3>Last Items Rates</h3>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Item Name1</th>
                  <th>Rate</th>
                  <th>Item Name2</th>
                  <th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {lastItemsRates.map((rate, index) => (
                  <tr key={index}>
                    <td>{new Date(rate.date).toLocaleDateString("en-GB")}</td>
                    <td>{rate.itemName1}</td>
                    <td>{rate.rate1}</td>
                    <td>{rate.itemName2}</td>
                    <td>{rate.rate2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
          <select
            name="itemName1"
            value={formData.itemName1}
            onChange={handleChange}
            required
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.itemName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantity 1:</label>
          <input
            type="number"
            name="item1Quantity"
            value={formData.item1Quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Rate Including Tax 1:</label>
          <input
            type="number"
            name="item1Rate"
            value={formData.item1Rate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Total 1:</label>
          <input
            type="number"
            name="item1Total"
            value={formData.item1Total}
            readOnly
          />
        </div>
        <div className="form-group">
          <label>Item Name 2:</label>
          <select
            name="itemName2"
            value={formData.itemName2}
            onChange={handleChange}
          >
            <option value="">Select Item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.itemName}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Quantity 2:</label>
          <input
            type="number"
            name="item2Quantity"
            value={formData.item2Quantity}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Rate Including Tax 2:</label>
          <input
            type="number"
            name="item2Rate"
            value={formData.item2Rate}
            onChange={handleChange}
          />
        </div>
        <div className="form-group">
          <label>Total 2:</label>
          <input
            type="number"
            name="item2Total"
            value={formData.item2Total}
            readOnly
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
            readOnly
          />
        </div>

        <button type="submit">Add Invoice</button>
      </form>
    </div>
  );
};

export default AddInvoice;
