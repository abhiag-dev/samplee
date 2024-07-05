// src/App.js
import React from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import InvoiceList from "./components/InvoiceList";
// import EditInvoice from "./components/EditInvoice";
import CustomerList from "./components/CustomerList";
import Navbar from "./components/Navbar";
import ViewInvoice from "./components/viewinvoice";
import AddInvoice from "./components/AddInvoice";
import EditCustomer from "./components/EditCustomer";
// import AddCustomer from "./components/AddCustomer";
import EditInvoice from "./components/EditInvoice";
const App = () => {
  return (
    <Router>
      <Navbar />
      <div className="content">
        <Routes>
          <Route path="/" element={<InvoiceList />} />
          <Route path="/edit/:CustomerName" element={<EditCustomer />} />
          <Route
            path="/edit-invoice/:InvoiceNumber"
            element={<EditInvoice />}
          />
          <Route path="/customers" element={<CustomerList />} />
          {/* <Route path="/add-customer" element={<AddCustomer />} /> */}
          <Route
            path="/addinvoice"
            element={
              <div>
                <AddInvoice />
                <ViewInvoice />
              </div>
            }
          />
          <Route
            path="/view-invoice/:invoiceNumber"
            element={<ViewInvoice />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
