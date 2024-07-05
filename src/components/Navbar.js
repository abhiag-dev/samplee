// src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
import "../css/Navbar.css"; // Add some CSS for styling if needed

const Navbar = () => {
  return (
    <div className="navbar-container">
      <nav className="navbar">
        <h1>Invoice Management</h1>
        <ul>
          <li>
            <Link to="/">List Invoices</Link>
          </li>
          <li>
            <Link to="/customers">List Customers</Link>
          </li>
          <li>
            <Link to="/addinvoice">add invoice</Link>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Navbar;
