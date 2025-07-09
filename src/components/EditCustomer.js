// src/components/EditCustomer.js
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "./axios";
// import "../css/EditCustomer.css";

const EditCustomer = () => {
  const { id } = useParams();
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    fetchCustomer();
  }, []);

  const fetchCustomer = async () => {
    try {
      const response = await axios.get(
        `http://localhost:3001/api/customers/${id}`
      );
      setCustomer(response.data);
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const [formData, setFormData] = useState({
    CustomerName: "",
    receiverGSTIN: "",
    mobile: "",
    receiverAddress: "",
    receiverCityState: "",
    pincode: "",
    placeOfSupply: "",
    receiverState: "",
    receiverStateCode: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        CustomerName: customer.CustomerName,
        receiverGSTIN: customer.receiverGSTIN,
        mobile: customer.mobile,
        receiverAddress: customer.receiverAddress,
        receiverCityState: customer.receiverCityState,
        pincode: customer.pincode,
        placeOfSupply: customer.placeOfSupply,
        receiverState: customer.receiverState,
        receiverStateCode: customer.receiverStateCode,
      });
    }
  }, [customer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `http://localhost:3001/api/customers/edit/${id}`,
        formData
      );
      setCustomer(response.data);
      alert("Customer updated successfully!");
    } catch (error) {
      console.error("Error updating customer:", error);
      alert("Failed to update customer. Please try again.");
    }
  };

  return (
    <div className="container">
      <h2>Edit Customer</h2>
      {customer && (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              name="CustomerName"
              value={formData.CustomerName}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>GSTIN:</label>
            <input
              type="text"
              name="receiverGSTIN"
              value={formData.receiverGSTIN}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Mobile No.:</label>
            <input
              type="text"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Address:</label>
            <input
              type="text"
              name="receiverAddress"
              value={formData.receiverAddress}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>City/State:</label>
            <input
              type="text"
              name="receiverCityState"
              value={formData.receiverCityState}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Pincode:</label>
            <input
              type="text"
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Place of Supply:</label>
            <input
              type="text"
              name="placeOfSupply"
              value={formData.placeOfSupply}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>State:</label>
            <input
              type="text"
              name="receiverState"
              value={formData.receiverState}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>State Code:</label>
            <input
              type="text"
              name="receiverStateCode"
              value={formData.receiverStateCode}
              onChange={handleChange}
            />
          </div>
          <button type="submit">Update Customer</button>
        </form>
      )}
    </div>
  );
};

export default EditCustomer;
