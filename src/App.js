import React, { useState } from "react";
import crackersData from "./crackers_data.json";
import "./App.css";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function App() {
  const products = crackersData.fireworks_catalog;

  const [cart, setCart] = useState([]);
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPlace, setCustomerPlace] = useState("");

  // Find product for preview
  const selectedProduct = products.find(
    (p) => p.product_id === Number(productId)
  );

  const addToCart = () => {
    if (!selectedProduct) return alert("Invalid Product ID");

    // Convert "Rs. 33.00" -> 33.00 safely
    const parsePrice = (val) => parseFloat(val?.replace("Rs.", "").trim()) || 0;

    const price = parsePrice(selectedProduct.discount_80_off);
    const agenciesPrice = parsePrice(selectedProduct.agencies_rate);

    const amount = price * qty;
    const agenciesAmount = agenciesPrice * qty;

    const newItem = {
      id: selectedProduct.product_id,
      name_en: selectedProduct.name_of_the_product,
      name_ta: selectedProduct.tamil_name,
      qty,
      price,
      amount,
      agenciesPrice,
      agenciesAmount,
    };

    setCart((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id
            ? {
                ...item,
                qty: item.qty + qty,
                amount: (item.qty + qty) * price,
                agenciesAmount: (item.qty + qty) * agenciesPrice,
              }
            : item
        );
      }
      return [...prev, newItem];
    });

    setProductId("");
    setQty(1);
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalAgencies = cart.reduce(
    (sum, item) => sum + (item.agenciesAmount || 0),
    0
  );

  // -------- PDF GENERATION ----------
  const generatePDF = (type) => {
    if (!customerName) {
      return alert("Please enter customer name before downloading PDF");
    }

    const doc = new jsPDF();

    // Title + customer info
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");

    if (type === "svpp") {
      doc.setTextColor(255, 0, 0); // red color
      doc.text("SVPP Crackers Internal Bill", 14, 15);
    } else {
      doc.setTextColor(0, 0, 0); // black color
      doc.text("SVPP Crackers", 14, 15);
    }

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(0, 0, 0); // reset color
    doc.text(`Customer Name: ${customerName}`, 14, 25);
    doc.text(`Place: ${customerPlace || "-"}`, 14, 32);

    let headers = [];
    let rows = [];

    if (type === "customer") {
      headers = [
        [
          "S.No",
          "Product ID",
          "Product Name",
          "Qty",
          "SVPP Price (per)",
          "Total Amount",
        ],
      ];

      rows = cart.map((item, i) => [
        i + 1,
        item.id,
        item.name_en,
        item.qty,
        `Rs. ${item.price?.toFixed(2)}`,
        `Rs. ${item.amount?.toFixed(2)}`,
      ]);

      // Total row
      rows.push(["", "", "", "", "Total", `Rs. ${total.toFixed(2)}`]);
    } else if (type === "svpp") {
      headers = [
        [
          "S.No",
          "Product ID",
          "Product Name",
          "Qty",
          "SVPP Price (per)",
          "Total Amount",
        ],
      ];

      rows = cart.map((item, i) => [
        i + 1,
        item.id,
        item.name_en,
        item.qty,
        `Rs. ${item.price?.toFixed(2)}`,
        `Rs. ${item.amount?.toFixed(2)}`,
      ]);

      // Total row
      rows.push(["", "", "Total", "", "", `Rs. ${total.toFixed(2)}`]);
      // Profit row
      rows.push([
        "",
        "",
        "Profit for SVPP Crackers",
        "",
        "",
        `Rs. ${(total - totalAgencies).toFixed(2)}`,
      ]);
    }

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 40,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: {
        fillColor: type === "svpp" ? [255, 0, 0] : [255, 204, 0], // red for SVPP, yellow for customer
        textColor: type === "svpp" ? 255 : 0, // white for SVPP, black for customer
        fontStyle: "bold",
      },
      didParseCell: function (data) {
        if (
          data.cell.raw === "Total" ||
          data.cell.raw === "Profit for SVPP Crackers"
        ) {
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // File name
    const fileName =
      type === "customer"
        ? `${customerName}_${customerPlace || "-"}.pdf`
        : `${customerName}_${customerPlace || "-"}_internal_bill.pdf`;

    doc.save(fileName);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>🎆 SVPP Billing System</h1>

      {/* Customer details input */}
      <div className="form-container">
        <div className="form-group">
          <label>Customer Name</label>
          <input
            type="text"
            placeholder="Enter name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Place</label>
          <input
            type="text"
            placeholder="Enter place"
            value={customerPlace}
            onChange={(e) => setCustomerPlace(e.target.value)}
          />
        </div>
      </div>

      {/* Input form */}
      <div className="form-container">
        <div className="form-group">
          <label>Product ID</label>
          <input
            type="number"
            placeholder="Enter Product ID"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Quantity</label>
          <input
            type="number"
            min="1"
            placeholder="Enter Qty"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />
        </div>
        <button className="add-btn" onClick={addToCart}>
          Add to Cart
        </button>
      </div>

      {/* Cart list */}
      <h2>🛒 Cart</h2>

      {/* PDF Buttons */}
      {cart.length > 0 && (
        <div style={{ marginBottom: "15px" }}>
          <button
            className="add-btn"
            style={{ marginRight: "10px" }}
            onClick={() => generatePDF("customer")}
          >
            Download PDF for Customer
          </button>
          <button className="add-btn" onClick={() => generatePDF("svpp")}>
            Download PDF for SVPP
          </button>
        </div>
      )}

      {cart.length === 0 ? (
        <p>No products added</p>
      ) : (
        <table className="crackers-table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Product ID</th>
              <th>Product Name</th>
              <th>விபரம்</th>
              <th>Qty</th>
              <th>Agencies Rate</th>
              <th>Agencies Total Amount</th>
              <th>SVPP Price (per)</th>
              <th>Total Amount</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item, index) => (
              <tr key={item.id}>
                <td>{index + 1}</td>
                <td>{item.id}</td>
                <td>{item.name_en}</td>
                <td style={{ color: "green" }}>{item.name_ta}</td>
                <td>{item.qty}</td>
                <td>Rs. {item.agenciesPrice?.toFixed(2)}</td>
                <td>Rs. {item.agenciesAmount?.toFixed(2)}</td>
                <td>Rs. {item.price?.toFixed(2)}</td>
                <td>Rs. {item.amount?.toFixed(2)}</td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => removeFromCart(item.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan="6" style={{ fontWeight: "bold" }}>
                Total
              </td>
              <td style={{ fontWeight: "bold" }}>
                Rs. {totalAgencies.toFixed(2)}
              </td>
              <td></td>
              <td style={{ fontWeight: "bold" }}>Rs. {total.toFixed(2)}</td>
              <td></td>
            </tr>
            <tr>
              <td colSpan="6" style={{ fontWeight: "bold" }}>
                Profit for SVPP Crackers
              </td>
              <td colSpan="3" style={{ fontWeight: "bold", color: "blue" }}>
                Rs. {(total - totalAgencies).toFixed(2)}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

export default App;
