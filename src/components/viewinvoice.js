import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import "../css/ViewInvoice.css";

const ViewInvoice = () => {
  const { invoiceNumber } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [itemDetails, setItemDetails] = useState([]);

  const generatePDFDocument = () => {
    const input = document.getElementById("NEW BILL BOOK 24-2025_24295");
    const scale = 1; // Increase scale for better resolution
    html2canvas(input, { scale: scale })
      .then((canvas) => {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF("p", "mm", "a4");
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${invoiceNumber}_invoice.pdf`);
      })
      .catch((error) => {
        console.error("Error generating PDF:", error);
      });
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axios.get(
          `https://backendserver-52a3.onrender.com/invoices/${invoiceNumber}`
        );
        const invoiceData = response.data;
        const customerData = await fetchCustomer(invoiceData.CustomerName);

        // Combine invoice and customer data
        const combinedData = { ...invoiceData, ...customerData[0] };
        setInvoice(combinedData);

        // Fetch item details
        const itemIds = [
          response.data.itemName1,
          response.data.item2Quantity === 0 || response.data.item2Rate === 0
            ? response.data.itemName2
            : null,

          parseInt(response.data.freight),
        ];
        const itemDetailsPromises = itemIds.map((itemId) =>
          fetchItemDetails(itemId, customerData.receiverStateCode)
        );
        const itemsDetails = await Promise.all(itemDetailsPromises);
        setItemDetails(itemsDetails);
        console.log(itemsDetails);
      } catch (error) {
        console.error("There was an error fetching the invoice!", error);
      }
    };

    fetchInvoice();
  }, [invoiceNumber]);
  const fetchCustomer = async (customerName) => {
    try {
      const response = await axios.get(
        `https://backendserver-52a3.onrender.com/customers/${customerName}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching customer:", error);
      return null;
    }
  };
  const fetchItemDetails = async (itemId, receiverStateCode) => {
    try {
      let response;
      let details;
      // console.log(typeof itemId);

      // console.log(itemId);
      if (typeof itemId == "number") {
        details = await axios.get(
          `https://backendserver-52a3.onrender.com/items/Freight`
        );
        details = details.data[0];
      } else if (itemId) {
        response = await axios.get(
          `https://backendserver-52a3.onrender.com/items/${itemId}`
        );
        details = response.data[0];
      }

      // response.data;
      // details += detailsa;
      // details = details[0];

      let cgst = details.cgst;
      let sgst = details.sgst;
      let igst = null;
      let grossRate = 100 / (100 + (cgst + sgst));

      let grossTotal, taxi, taxs, taxc;
      if (receiverStateCode !== "27") {
        igst = cgst + sgst;
        details.cgst = null;
        details.sgst = null;
      }
      // console.log(itemId);
      return {
        ...details,
        igst,
        grossRate,
        grossTotal,
        taxi,
        taxs,
        taxc,
      };
    } catch (error) {
      console.error("Error fetching item details:", error);
      return null;
    }
  };

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
  ];
  const teens = [
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "Ten",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function getBelowHundred(n) {
    if (n <= 10) return ones[n];
    if (n < 20) return teens[n - 11];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return tens[ten] + (unit > 0 ? " " + ones[unit] : "");
  }

  function getHundreds(n) {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    return (
      (hundred > 0 ? ones[hundred] + " hundred " : "") +
      (rest > 0 ? (getBelowHundred(rest) ? getBelowHundred(rest) : "") : "")
    );
  }

  function segmentNumber(num) {
    const segments = {
      crore: 0,
      lakh: 0,
      thousand: 0,
      hundred: 0,
    };

    segments.crore = Math.floor(num / 10000000);
    num %= 10000000;

    segments.lakh = Math.floor(num / 100000);
    num %= 100000;

    segments.thousand = Math.floor(num / 1000);
    num %= 1000;

    segments.hundred = num;

    return segments;
  }

  function numberToWords(num) {
    if (num === 0) return "zero";

    const segments = segmentNumber(num);
    const parts = [];

    if (segments.crore > 0) {
      parts.push(getBelowHundred(segments.crore) + " crore");
    }
    if (segments.lakh > 0) {
      parts.push(getBelowHundred(segments.lakh) + " lakh");
    }
    if (segments.thousand > 0) {
      parts.push(getHundreds(segments.thousand) + " thousand");
    }
    if (segments.hundred > 0) {
      parts.push(getHundreds(segments.hundred));
    }

    return parts.join(" ").trim();
  }
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  if (!invoice) {
    return <div>Loading...</div>;
  }
  const totalGrossTotal = itemDetails.reduce((accumulator, details) => {
    return details && details.grossTotal
      ? accumulator + parseFloat(details.grossTotal)
      : accumulator;
  }, 0);
  const totalcgst = itemDetails.reduce((accumulator, details) => {
    return details && details.taxc
      ? accumulator + parseFloat(details.taxc)
      : accumulator;
  }, 0);
  const totalsgst = itemDetails.reduce((accumulator, details) => {
    return details && details.taxs
      ? accumulator + parseFloat(details.taxs)
      : accumulator;
  }, 0);
  const totaligst = itemDetails.reduce((accumulator, details) => {
    return details && details.taxi
      ? accumulator + parseFloat(details.taxi)
      : accumulator;
  }, 0);

  return (
    <>
      <div>
        <button id="generate-pdf-btn" onClick={generatePDFDocument}>
          Generate PDF
        </button>
        {/* <button onClick={exportToExcel}>Export to Excel</button> */}
      </div>
      <div
        id="NEW BILL BOOK 24-2025_24295"
        style={{ paddingTop: "28.8pt" }}
        align="center"
      >
        <div className="top1"></div>
        <div className="top2"></div>
        <table
          border={0}
          cellPadding={0}
          cellSpacing={0}
          width={1230}
          style={{
            borderCollapse: "collapse",
            tableLayout: "fixed",
            width: "986pt",
          }}
        >
          <tbody>
            <tr height={38} style={{ height: "28.8pt" }}>
              <td
                height={38}
                className="xl6524295"
                width={61}
                style={{ height: "28.8pt", width: "46pt" }}
              >
                &nbsp;
              </td>

              <td
                colSpan={14}
                className="xl22824295"
                width={1104}
                style={{ width: "831pt" }}
              >
                CAN INDIA
              </td>
              <td
                className="xl6624295"
                width={65}
                style={{ borderRight: "1.0pt solid black", width: "49pt" }}
              >
                {/* &nbsp; */}
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl6724295"
                style={{ height: "18.0pt" }}
              ></td>

              <td colSpan={14} className="xl23024295">
                Plot no. 1,Krishna Complex,Beside National Car care
              </td>
              <td
                className="xl6824295"
                style={{ borderRight: "1.0pt solid black" }}
              />
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl6724295"
                style={{ height: "18.0pt" }}
              >
                &nbsp;
              </td>
              <td colSpan={14} className="xl23024295">
                Opposite Sai Weigh Bridge,Kapsi,Nagpur-440035 (M.S.)
              </td>
              <td
                className="xl6824295"
                style={{ borderRight: "1.0pt solid black" }}
              />
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl6724295"
                style={{ height: "18.0pt" }}
              >
                &nbsp;
              </td>

              <td colSpan={14} className="xl23024295">
                M: 9822225968, 9922997256. Fact:- 07109-278901
              </td>
              <td
                className="xl6824295"
                style={{ borderRight: "1.0pt solid black" }}
              />
            </tr>
            <tr height={28} style={{ height: "21.0pt" }}>
              <td
                height={28}
                className="xl6724295"
                style={{ height: "21.0pt" }}
              >
                &nbsp;
              </td>

              <td colSpan={14} className="xl23224295">
                Food License No.:-11518056000288
              </td>
              <td
                className="xl6824295"
                style={{ borderRight: "1.0pt solid black" }}
              />
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl6924295"
                style={{ height: "18.6pt" }}
              >
                &nbsp;
              </td>

              <td colSpan={14} className="xl23424295">
                E-mail:- agrawalsudhir@hotmail.com
              </td>
              <td
                className="xl7024295"
                style={{ borderRight: "1.0pt solid black" }}
              >
                &nbsp;
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={10}
                rowSpan={3}
                height={75}
                className="xl23624295"
                style={{
                  borderRight: "1.0pt solid black",
                  borderBottom: "1.0pt solid black",
                  height: "55.8pt",
                }}
              >
                INVOICE
              </td>
              <td
                colSpan={4}
                className="xl18924295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                Original for Receipient
              </td>
              <td
                colSpan={2}
                className="xl24524295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                &nbsp;
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={4}
                height={25}
                className="xl18924295"
                style={{
                  borderRight: "1.0pt solid black",
                  height: "18.6pt",
                  borderLeft: "none",
                }}
              >
                Dupliacte for Transporter
              </td>
              <td
                colSpan={2}
                className="xl24524295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                &nbsp;
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={4}
                height={25}
                className="xl18924295"
                style={{
                  borderRight: "1.0pt solid black",
                  height: "18.6pt",
                  borderLeft: "none",
                }}
              >
                Triplicate for Supplier
              </td>
              <td
                colSpan={2}
                className="xl24524295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                &nbsp;
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                colSpan={4}
                rowSpan={2}
                height={49}
                className="xl24724295"
                style={{
                  borderRight: "1.0pt solid black",
                  borderBottom: "1.0pt solid black",
                  height: "36.6pt",
                }}
              >
                <font className="font524295">GSTIN:</font>
                <font className="font624295">27ABGPA3665A1Z6</font>
              </td>
              <td className="xl6824295" /> <td className="xl6824295" />{" "}
              <td className="xl1524295" /> <td className="xl6824295" />{" "}
              <td className="xl6824295" /> <td className="xl6824295" />
              <td className="xl6824295" />
              <td
                colSpan={2}
                className="xl25024295"
                width={138}
                style={{ borderRight: "1.0pt solid black", width: "104pt" }}
              >
                Mode of Transport :
              </td>
              <td
                colSpan={3}
                className="xl25224295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice.itemName2 === "Freight" ||
                invoice.itemName1 === "Freight"
                  ? "By Road"
                  : "TO PAY"}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl6824295"
                style={{ height: "18.6pt" }}
              />
              <td className="xl6824295" />
              <td className="xl1524295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td
                colSpan={2}
                className="xl21324295"
                style={{ borderRight: "1.0pt solid black" }}
              >
                Vehicle No :
              </td>
              <td className="xl14424295" colSpan={2}>
                {invoice.vehicleNumber}
              </td>
              <td className="xl14624295" style={{ borderTop: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={49} style={{ height: "36.6pt" }}>
              <td
                height={49}
                className="xl14224295"
                width={61}
                style={{ height: "36.6pt", borderTop: "none", width: "46pt" }}
              >
                Invoice No.:
              </td>
              <td
                className="xl14324295"
                width={65}
                style={{ borderTop: "none", width: "49pt" }}
              >
                &nbsp;
              </td>
              <td
                className="xl7424295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                {invoice.invoiceNumber}
              </td>
              <td className="xl7524295" style={{ borderTop: "none" }}>
                &nbsp;
              </td>
              <td className="xl7624295" />
              <td className="xl6824295" />
              <td className="xl1524295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td
                colSpan={2}
                className="xl21324295"
                style={{ borderRight: "1.0pt solid black" }}
              >
                Date :
              </td>
              <td
                colSpan={3}
                className="xl21524295"
                style={{ borderRight: "1.0pt solid black" }}
              >
                {/* 5-6--2024 */}
                {formatDate(invoice.date)}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl7724295"
                style={{ height: "18.6pt" }}
              >
                &nbsp;
              </td>
              <td className="xl7824295">&nbsp;</td>
              <td className="xl7824295">&nbsp;</td>
              <td className="xl7824295">&nbsp;</td>
              <td className="xl7824295">&nbsp;</td>
              <td className="xl6824295" />
              <td className="xl1524295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td
                colSpan={2}
                className="xl21824295"
                style={{ borderRight: "1.0pt solid black" }}
              >
                Place OF Supply:
              </td>
              <td
                colSpan={3}
                className="xl22024295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice.receiverCityState}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={8}
                height={25}
                className="xl22324295"
                style={{ borderRight: "1.0pt solid black", height: "18.6pt" }}
              >
                Details of Receiver (Billed to)
              </td>
              <td
                colSpan={8}
                className="xl22324295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                Details of Consignee (Shipped to)
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={2}
                height={25}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", height: "18.6pt" }}
              >
                Name:
              </td>
              <td
                colSpan={6}
                className="xl26424295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverName}
              </td>
              <td
                colSpan={2}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                Name:
              </td>
              <td
                colSpan={6}
                className="xl22524295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverName}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={2}
                height={25}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", height: "18.6pt" }}
              >
                Address :
              </td>
              <td
                colSpan={6}
                className="xl26724295"
                style={{ borderRight: "1.0pt solid black" }}
              >
                {invoice && invoice.receiverAddress}
              </td>
              <td
                colSpan={2}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                Address :
              </td>
              <td
                colSpan={6}
                className="xl22524295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverAddress}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={2}
                height={25}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", height: "18.6pt" }}
              >
                &nbsp;
              </td>
              <td
                colSpan={6}
                className="xl26724295"
                style={{ borderRight: "1.0pt solid black" }}
              >
                {invoice && invoice.receiverCityState}
              </td>
              <td
                colSpan={2}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                &nbsp;
              </td>
              <td
                colSpan={6}
                className="xl22524295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverCityState}
              </td>
            </tr>
            <tr height={29} style={{ height: "21.6pt" }}>
              <td
                colSpan={2}
                height={29}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", height: "21.6pt" }}
              >
                GSTIN
              </td>
              <td
                colSpan={6}
                className="xl25724295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverGSTIN}
              </td>
              <td
                colSpan={2}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                GSTIN
              </td>
              <td
                colSpan={6}
                className="xl19424295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverGSTIN}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={2}
                height={25}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", height: "18.6pt" }}
              >
                State:
              </td>
              <td
                colSpan={2}
                className="xl22024295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverState}
              </td>
              <td
                colSpan={2}
                className="xl26124295"
                style={{ borderLeft: "none" }}
              >
                State Code :
              </td>
              <td
                colSpan={2}
                className="xl26224295"
                style={{ borderRight: "1.0pt solid black" }}
              >
                {invoice && invoice.receiverStateCode}
              </td>
              <td
                colSpan={2}
                className="xl19224295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                State:
              </td>
              <td
                colSpan={2}
                className="xl19724295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverState}
              </td>
              <td
                colSpan={2}
                className="xl19924295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                State Code :
              </td>
              <td
                colSpan={2}
                className="xl20124295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                {invoice && invoice.receiverStateCode}
              </td>
            </tr>

            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                rowSpan={2}
                height={48}
                className="xl20324295"
                style={{
                  borderBottom: ".5pt solid black",
                  height: "36.0pt",
                  borderTop: "none",
                }}
              >
                S.No
              </td>
              <td
                colSpan={3}
                rowSpan={2}
                className="xl20524295"
                style={{
                  borderRight: ".5pt solid black",
                  borderBottom: ".5pt solid black",
                }}
              >
                Description of Goods
              </td>
              <td
                rowSpan={2}
                className="xl20924295"
                width={72}
                style={{
                  borderBottom: ".5pt solid black",
                  borderTop: "none",
                  width: "54pt",
                }}
              >
                HSN Code
              </td>

              <td
                rowSpan={2}
                className="xl20924295"
                width={6}
                style={{
                  borderBottom: ".5pt solid black",
                  borderTop: "none",
                  width: "49pt",
                }}
              >
                Quantity
              </td>
              <td
                rowSpan={2}
                className="xl21124295"
                style={{ borderBottom: ".5pt solid black", borderTop: "none" }}
              >
                Rate
              </td>
              <td
                rowSpan={2}
                className="xl21124295"
                style={{ borderBottom: ".5pt solid black", borderTop: "none" }}
              >
                Total
              </td>
              <td
                rowSpan={2}
                className="xl20924295"
                width={65}
                style={{
                  borderBottom: ".5pt solid black",
                  borderTop: "none",
                  width: "49pt",
                }}
              >
                Discount
              </td>
              <td
                rowSpan={2}
                className="xl21124295"
                style={{ borderBottom: ".5pt solid black", borderTop: "none" }}
              >
                Taxable value
              </td>
              <td
                className="xl10024295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                CGST
              </td>
              <td className="xl10124295" style={{ borderTop: "none" }}>
                &nbsp;
              </td>
              <td className="xl10124295" style={{ borderTop: "none" }}>
                SGST
              </td>
              <td className="xl10224295" style={{ borderTop: "none" }}>
                &nbsp;
              </td>
              <td
                className="xl10024295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                IGST
              </td>
              <td className="xl10324295" style={{ borderTop: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl10424295"
                style={{
                  height: "18.0pt",
                  borderTop: "none",
                  borderLeft: "none",
                }}
              >
                Rate
              </td>
              <td
                className="xl10424295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                Amount
              </td>
              <td
                className="xl10424295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                Rate
              </td>
              <td
                className="xl10424295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                Amount
              </td>
              <td
                className="xl10524295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                Rate
              </td>
              <td
                className="xl10624295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                Amount
              </td>
            </tr>

            {itemDetails.map((details, index) =>
              details ? (
                <tr height={24} style={{ height: "18.0pt" }}>
                  <td
                    height={24}
                    className="xl7924295"
                    align="right"
                    style={{ height: "40.0pt" }}
                  >
                    {details.itemName !== "Freight" ? index + 1 : null}
                  </td>
                  <td
                    colSpan={3}
                    className="xl8424295"
                    style={{
                      borderRight: ".5pt solid black",
                      borderLeft: "none",
                    }}
                  >
                    {details.itemName}
                  </td>
                  <td className="xl8124295"> {details.hsnCode}</td>
                  <td className="xl8224295" align="right">
                    {details.itemName !== "Freight" ? (
                      index === 0 ? (
                        invoice.item1Quantity
                      ) : (
                        invoice.item2Quantity
                      )
                    ) : (
                      <></>
                    )}
                  </td>
                  <td className="xl8324295" align="right">
                    {details.itemName !== "Freight" ? (
                      (details.grossTotal =
                        invoice[`item${index + 1}Rate`] *
                        details.grossRate).toFixed(2)
                    ) : (
                      <></>
                    )}
                  </td>

                  <td className="xl13924295" align="right">
                    {details.itemName !== "Freight"
                      ? index === 0
                        ? (details.grossTotal = (
                            invoice.item1Quantity * details.grossTotal
                          ).toFixed(0))
                        : (details.grossTotal = (
                            invoice.item2Quantity * details.grossTotal
                          ).toFixed(0))
                      : (details.grossTotal = invoice.freight)}
                  </td>

                  <td className="xl14024295">&nbsp;</td>
                  <td className="xl13924295" align="right">
                    <td align="right">{details.grossTotal}</td>
                  </td>
                  <td
                    className="xl8224295"
                    align="right"
                    style={{ borderLeft: "none" }}
                  >
                    {details.cgst}
                  </td>
                  <td
                    className="xl10924295"
                    align="right"
                    style={{ borderLeft: "none" }}
                  >
                    {details.cgst
                      ? (details.taxc =
                          details.grossTotal *
                          ((details.cgst || 0) / 100)).toFixed(0)
                      : null}
                  </td>
                  <td
                    className="xl8224295"
                    align="right"
                    style={{ borderLeft: "none" }}
                  >
                    {details.sgst}
                  </td>
                  <td
                    className="xl10924295"
                    align="right"
                    style={{ borderLeft: "none" }}
                  >
                    {details.sgst
                      ? (details.taxs =
                          details.grossTotal *
                          ((details.sgst || 0) / 100)).toFixed(0)
                      : null}
                  </td>
                  <td className="xl8224295" style={{ borderLeft: "none" }}>
                    {details.igst}
                  </td>
                  <td
                    className="xl10924295"
                    align="right"
                    style={{ borderLeft: "none" }}
                  >
                    {details.igst
                      ? (details.taxi =
                          details.grossTotal *
                          ((details.igst || 0) / 100)).toFixed(0)
                      : null}
                  </td>
                </tr>
              ) : (
                <tr height={24} style={{ height: "18.0pt" }}>
                  <td
                    height={24}
                    className="xl7924295"
                    style={{ height: "18.0pt" }}
                  >
                    &nbsp;
                  </td>
                  <td
                    colSpan={3}
                    className="xl8424295"
                    style={{
                      borderRight: ".5pt solid black",
                      borderLeft: "none",
                    }}
                  >
                    &nbsp;
                  </td>
                  {/* <td className="xl8124295">&nbsp;</td> */}
                  <td className="xl8224295">&nbsp;</td>
                  <td className="xl8224295">&nbsp;</td>
                  <td className="xl8324295">&nbsp;</td>
                  <td className="xl13924295">&nbsp;</td>
                  <td className="xl14024295">&nbsp;</td>
                  <td className="xl13924295">&nbsp;</td>
                  <td className="xl14124295" style={{ borderLeft: "none" }}>
                    &nbsp;
                  </td>
                  <td className="xl10924295" style={{ borderLeft: "none" }}>
                    &nbsp;
                  </td>
                  <td className="xl14124295" style={{ borderLeft: "none" }}>
                    &nbsp;
                  </td>
                  <td className="xl10924295" style={{ borderLeft: "none" }}>
                    &nbsp;
                  </td>
                  <td className="xl11024295" style={{ borderLeft: "none" }}>
                    &nbsp;
                  </td>
                  <td className="xl10924295" style={{ borderLeft: "none" }}>
                    &nbsp;
                  </td>
                </tr>
              )
            )}
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl7924295"
                style={{ height: "18.0pt" }}
              >
                &nbsp;
              </td>
              <td
                colSpan={3}
                className="xl8424295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                &nbsp;
              </td>
              {/* <td className="xl8124295">&nbsp;</td> */}
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8324295">&nbsp;</td>
              <td className="xl13924295">&nbsp;</td>
              <td className="xl14024295">&nbsp;</td>
              <td className="xl13924295">&nbsp;</td>
              <td className="xl14124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl14124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl11024295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl7924295"
                style={{ height: "18.0pt" }}
              >
                &nbsp;
              </td>
              <td
                colSpan={3}
                className="xl8424295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                &nbsp;
              </td>
              <td className="xl8124295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              {/* <td className="xl8224295">&nbsp;</td> */}
              <td className="xl8324295">&nbsp;</td>
              <td className="xl13924295">&nbsp;</td>
              <td className="xl14024295">&nbsp;</td>
              <td className="xl13924295">&nbsp;</td>
              <td className="xl14124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl14124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl11024295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl7924295"
                style={{ height: "18.0pt" }}
              >
                &nbsp;
              </td>
              <td
                colSpan={3}
                className="xl8424295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                &nbsp;
              </td>
              <td className="xl8124295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              {/* <td className="xl8224295">&nbsp;</td> */}
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr
              height={25}
              style={{ msoHeightSource: "userset", height: "18.75pt" }}
            >
              <td
                height={25}
                className="xl7924295"
                style={{ height: "18.75pt" }}
              >
                &nbsp;
              </td>
              <td
                colSpan={3}
                className="xl8424295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                &nbsp;
              </td>
              {/* <td className="xl8124295">&nbsp;</td> */}
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl7924295"
                style={{ height: "18.0pt" }}
              >
                &nbsp;
              </td>
              <td
                colSpan={3}
                className="xl25524295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              ></td>
              {/* <td className="xl8124295">&nbsp;</td> */}
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr
              height={50}
              style={{ msoHeightSource: "userset", height: "37.5pt" }}
            >
              <td
                height={50}
                className="xl7924295"
                style={{ height: "37.5pt" }}
              >
                &nbsp;
              </td>
              <td
                colSpan={3}
                className="xl16924295"
                width={199}
                style={{
                  borderRight: ".5pt solid black",
                  borderLeft: "none",
                  width: "150pt",
                }}
              ></td>
              {/* <td className="xl8124295">&nbsp;</td> */}
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl7924295"
                style={{ height: "18.0pt" }}
              >
                &nbsp;
              </td>
              <td className="xl8424295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl8424295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>{" "}
              <td className="xl8124295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl8224295">&nbsp;</td>
              <td className="xl8524295">&nbsp;</td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl11124295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl10924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl8624295"
                style={{ height: "18.6pt" }}
              >
                &nbsp;
              </td>
              <td className="xl8724295">&nbsp;</td>
              <td className="xl8024295">&nbsp;</td>
              <td className="xl8024295">&nbsp;</td>
              <td className="xl8824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl8924295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl8824295">&nbsp;</td>
              <td className="xl9024295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl8824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td
                className="xl11224295"
                align="right"
                style={{ borderLeft: "none" }}
              >
                {totalGrossTotal.toFixed(0)}
              </td>
              <td className="xl8824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td
                className="xl11224295"
                align="right"
                style={{ borderLeft: "none" }}
              >
                {totalcgst.toFixed(0)}
              </td>
              <td className="xl11324295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td
                className="xl11224295"
                align="right"
                style={{ borderLeft: "none" }}
              >
                {totalsgst.toFixed(0)}
              </td>
              <td className="xl11424295">&nbsp;</td>
              <td className="xl11224295" align="right">
                {totaligst.toFixed(0)}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl9124295"
                style={{ height: "18.6pt" }}
              >
                &nbsp;
              </td>
              <td className="xl9224295">&nbsp;</td>
              <td className="xl9224295">&nbsp;</td>
              <td className="xl9224295">&nbsp;</td>
              <td className="xl9224295">&nbsp;</td>
              <td className="xl9224295">&nbsp;</td>
              <td className="xl9224295">&nbsp;</td>
              <td className="xl9224295">&nbsp;</td>
              <td className="xl9224295">&nbsp;</td>
              <td className="xl11524295">&nbsp;</td>
              <td
                colSpan={5}
                className="xl17124295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                Total Amount Before Tax
              </td>
              <td
                className="xl11624295"
                align="right"
                style={{ borderLeft: "none" }}
              >
                {totalGrossTotal.toFixed(0)}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={3}
                height={25}
                className="xl17424295"
                style={{ borderRight: "1.0pt solid black", height: "18.6pt" }}
              >
                Invoice Total ( In Words) :
              </td>
              <td
                colSpan={7}
                rowSpan={2}
                className="xl17724295"
                width={544}
                style={{ borderRight: "1.0pt solid black", width: "409pt" }}
              >
                {numberToWords(
                  totalGrossTotal + totalcgst + totalsgst + totaligst
                ) + " Only"}
              </td>
              <td
                colSpan={5}
                className="xl18324295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                Add:- CGST
              </td>
              <td className="xl11724295" style={{ borderLeft: "none" }}>
                {totalcgst.toFixed(0)}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl9324295"
                style={{ height: "18.6pt" }}
              >
                &nbsp;
              </td>
              <td className="xl9424295" />
              <td className="xl9524295">&nbsp;</td>
              <td
                colSpan={5}
                className="xl18324295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                Add:- SGST
              </td>
              <td
                className="xl11824295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                {totalsgst.toFixed(0)}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl9324295"
                style={{ height: "18.6pt" }}
              >
                &nbsp;
              </td>
              <td className="xl9424295" />
              <td className="xl9524295">&nbsp;</td>
              <td className="xl9624295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl9724295" />
              <td className="xl9724295" />
              <td className="xl9724295" />
              <td className="xl9724295" />
              <td className="xl9724295" />
              <td className="xl11924295">&nbsp;</td>
              <td
                colSpan={5}
                className="xl18624295"
                style={{ borderRight: ".5pt solid black", borderLeft: "none" }}
              >
                Add:- IGST
              </td>
              <td
                className="xl12024295"
                style={{ borderTop: "none", borderLeft: "none" }}
              >
                {totaligst.toFixed(0)}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl7124295"
                style={{ height: "18.6pt" }}
              >
                &nbsp;
              </td>
              <td className="xl7224295">&nbsp;</td>
              <td className="xl7324295">&nbsp;</td>
              <td className="xl9824295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl9924295">&nbsp;</td>
              <td className="xl9924295">&nbsp;</td>
              <td className="xl9924295">&nbsp;</td>
              <td className="xl9924295">&nbsp;</td>
              <td className="xl9924295">&nbsp;</td>
              <td className="xl12124295">&nbsp;</td>
              <td
                colSpan={5}
                className="xl18924295"
                style={{ borderRight: "1.0pt solid black", borderLeft: "none" }}
              >
                Total Amount After Tax
              </td>
              <td className="xl12224295">
                {" "}
                {(totalGrossTotal + totalcgst + totalsgst + totaligst).toFixed(
                  0
                )}
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                height={25}
                className="xl6724295"
                style={{ height: "18.6pt" }}
              >
                &nbsp;
              </td>
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl6824295" />
              <td className="xl12324295" />
              <td className="xl12424295">&nbsp;</td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={3}
                height={25}
                className="xl14724295"
                width={260}
                style={{
                  borderRight: "1.0pt solid black",
                  height: "18.6pt",
                  width: "196pt",
                }}
              >
                Bank Details:
              </td>
              <td
                colSpan={6}
                className="xl15024295"
                width={434}
                style={{
                  borderRight: "1.0pt solid black",
                  borderLeft: "none",
                  width: "326pt",
                }}
              >
                Punjab National Bank
              </td>
              <td className="xl12524295" width={110} style={{ width: "83pt" }}>
                &nbsp;
              </td>
              <td className="xl12524295" width={65} style={{ width: "49pt" }}>
                &nbsp;
              </td>
              <td className="xl12524295" width={73} style={{ width: "55pt" }}>
                &nbsp;
              </td>
              <td className="xl12524295" width={65} style={{ width: "49pt" }}>
                &nbsp;
              </td>
              <td className="xl12524295" width={72} style={{ width: "54pt" }}>
                &nbsp;
              </td>
              <td className="xl12624295" width={74} style={{ width: "56pt" }}>
                &nbsp;
              </td>
              <td className="xl12724295" width={77} style={{ width: "58pt" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={3}
                height={25}
                className="xl14724295"
                width={260}
                style={{
                  borderRight: "1.0pt solid black",
                  height: "18.6pt",
                  width: "196pt",
                }}
              >
                Account No.:-
              </td>
              <td
                colSpan={6}
                className="xl15024295"
                width={434}
                style={{
                  borderRight: "1.0pt solid black",
                  borderLeft: "none",
                  width: "326pt",
                }}
              >
                . 0354008700010457
              </td>
              <td
                className="xl12824295"
                width={110}
                style={{ width: "83pt" }}
              />
              <td className="xl12824295" width={65} style={{ width: "49pt" }} />
              <td className="xl12824295" width={73} style={{ width: "55pt" }} />
              <td className="xl12824295" width={65} style={{ width: "49pt" }} />
              <td className="xl12824295" width={72} style={{ width: "54pt" }} />
              <td className="xl12924295" width={74} style={{ width: "56pt" }} />
              <td className="xl13024295" width={77} style={{ width: "58pt" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={25} style={{ height: "18.6pt" }}>
              <td
                colSpan={3}
                height={25}
                className="xl14724295"
                width={260}
                style={{
                  borderRight: "1.0pt solid black",
                  height: "18.6pt",
                  width: "196pt",
                }}
              >
                IFSC CODE:-
              </td>
              <td
                colSpan={6}
                className="xl15024295"
                width={434}
                style={{
                  borderRight: "1.0pt solid black",
                  borderLeft: "none",
                  width: "326pt",
                }}
              >
                PUNB0035400
              </td>
              <td
                className="xl12824295"
                width={110}
                style={{ width: "83pt" }}
              />
              <td className="xl12824295" width={65} style={{ width: "49pt" }} />
              <td className="xl12824295" width={73} style={{ width: "55pt" }} />
              <td className="xl12824295" width={65} style={{ width: "49pt" }} />
              <td className="xl12824295" width={72} style={{ width: "54pt" }} />
              <td className="xl12924295" width={74} style={{ width: "56pt" }} />
              <td className="xl13024295" width={77} style={{ width: "58pt" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                colSpan={3}
                height={24}
                className="xl14724295"
                width={260}
                style={{
                  borderRight: "1.0pt solid black",
                  height: "18.0pt",
                  width: "196pt",
                }}
              >
                Branch
              </td>
              <td
                colSpan={6}
                className="xl15024295"
                width={434}
                style={{
                  borderRight: "1.0pt solid black",
                  borderLeft: "none",
                  width: "326pt",
                }}
              >
                Kingsway
              </td>
              <td className="xl13124295" width={110} style={{ width: "83pt" }}>
                &nbsp;
              </td>
              <td className="xl13124295" width={65} style={{ width: "49pt" }}>
                &nbsp;
              </td>
              <td className="xl13124295" width={73} style={{ width: "55pt" }}>
                &nbsp;
              </td>
              <td className="xl13124295" width={65} style={{ width: "49pt" }}>
                &nbsp;
              </td>
              <td className="xl13124295" width={72} style={{ width: "54pt" }}>
                &nbsp;
              </td>
              <td className="xl13224295" width={74} style={{ width: "56pt" }}>
                &nbsp;
              </td>
              <td className="xl13324295" width={77} style={{ width: "58pt" }}>
                &nbsp;
              </td>
            </tr>
            <tr height={31} style={{ height: "23.4pt" }}>
              <td
                colSpan={9}
                height={31}
                className="xl15324295"
                width={694}
                style={{
                  borderRight: ".5pt solid black",
                  height: "23.4pt",
                  width: "522pt",
                }}
              >
                Certified that the Particulars given above are true and correct
              </td>
              <td
                colSpan={7}
                className="xl15624295"
                width={536}
                style={{
                  borderRight: "1.0pt solid black",
                  borderLeft: "none",
                  width: "404pt",
                }}
              >
                For CAN INDIA
              </td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                colSpan={9}
                rowSpan={4}
                height={101}
                className="xl15924295"
                width={694}
                style={{
                  borderRight: ".5pt solid black",
                  borderBottom: "1.0pt solid black",
                  height: "75.6pt",
                  width: "522pt",
                }}
              >
                TERMS OF SALE 1) Goods once sold will not be taken back or
                exchanged 2)Seller is not responsible for any loss or damaged of
                goods in transit 3)Disputes if any will be subject to seller
                court jurisdication
              </td>
              <td className="xl13424295" style={{ borderLeft: "none" }}>
                &nbsp;
              </td>
              <td className="xl13524295" />
              <td className="xl13524295" />
              <td className="xl13524295" />
              <td className="xl13524295" />
              <td className="xl13624295" />
              <td className="xl13724295">&nbsp;</td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl13424295"
                style={{ height: "18.0pt", borderLeft: "none" }}
              >
                &nbsp;
              </td>
              <td className="xl13524295" />
              <td className="xl13824295" />
              <td className="xl13524295" />
              <td className="xl13524295" />
              <td className="xl13624295" />
              <td className="xl13724295">&nbsp;</td>
            </tr>
            <tr height={24} style={{ height: "18.0pt" }}>
              <td
                height={24}
                className="xl13424295"
                style={{ height: "18.0pt", borderLeft: "none" }}
              >
                &nbsp;
              </td>
              <td className="xl13524295" />
              <td className="xl13524295" />
              <td className="xl13524295" />
              <td className="xl13524295" />
              <td className="xl13624295" />
              <td className="xl13724295">&nbsp;</td>
            </tr>
            <tr height={29} style={{ height: "21.6pt" }}>
              <td
                colSpan={7}
                height={29}
                className="xl16524295"
                style={{
                  borderRight: "1.0pt solid black",
                  height: "21.6pt",
                  borderLeft: "none",
                }}
              >
                Authorised Signatory
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
};

export default ViewInvoice;
