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
          <Route
            path="/test"
            element={
              <iframe
                width="1200"
                height="600"
                frameborder="0"
                scrolling="no"
                src="https://onedrive.live.com/embed?resid=8DBFDDE7F94D9700%2164933&authkey=%21AKEqcdv9H6gi3u4&em=2&wdAllowInteractivity=False&wdHideGridlines=True&wdHideHeaders=True&wdDownloadButton=True&wdInConfigurator=True&wdInConfigurator=True"
              ></iframe>
            }
          />
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
