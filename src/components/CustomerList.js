// src/components/CustomerList.js
import React, { useEffect, useState } from "react";
import axios from "./axios";
import { Link } from "react-router-dom";
import "../css/CustomerList.css"; // Import CSS for styling if needed

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(
        "/customers"
      );
      setCustomers(response.data);
    } catch (error) {
      console.error("Error fetching customers:", error);
    }
  };

  return (
    <div>
      <h2>Customer List</h2>
      <table>
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>GSTIN</th>
            <th>Mobile</th>
            <th>Address</th>
            <th>City</th>
            <th>State</th>
            <th>State Code</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.CustomerName}</td>
              <td>{customer.receiverGSTIN}</td>
              <td>{customer.mobile}</td>
              <td>{customer.receiverAddress}</td>
              <td>{customer.receiverCityState}</td>
              <td>{customer.receiverState}</td>
              <td>{customer.receiverStateCode}</td>
              <td>
                <Link to={`/edit-customer/${customer.CustomerName}`}>Edit</Link>{" "}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerList;
