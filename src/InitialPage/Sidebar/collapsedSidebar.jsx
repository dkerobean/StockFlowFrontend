import React, { useState } from "react";
import { Link } from "react-router-dom";
import Image from "../../core/img/image";

const CollapsedSidebar = () => {
  const [isActive, setIsActive] = useState(false);
  const [isActive2, setIsActive2] = useState(false);
  const [isActive3, setIsActive3] = useState(false);
  const [isActive7, setIsActive7] = useState(false);

  const handleSelectClick = () => {
    setIsActive(!isActive);
  };
  const handleSelectClick2 = () => {
    setIsActive2(!isActive2);
  };
  const handleSelectClick3 = () => {
    setIsActive3(!isActive3);
  };
  const handleSelectClick7 = () => {
    setIsActive7(!isActive7);
  };

  return (
    <div className="sidebar collapsed-sidebar" id="collapsed-sidebar">
      <div className="sidebar-inner slimscroll">
        <div id="sidebar-menu-2" className="sidebar-menu sidebar-menu-three">
          <aside id="aside" className="ui-aside">
            <ul className="tab nav nav-tabs" id="myTab" role="tablist">
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  to="#home"
                  id="home-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#home"
                  role="tab"
                  aria-selected="true"
                >
                  <Image src="assets/img/icons/menu-icon.svg" alt="img" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  to="#messages"
                  id="messages-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#product"
                  role="tab"
                  aria-selected="false"
                >
                  <Image src="assets/img/icons/product.svg" alt="img" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  to="#profile"
                  id="profile-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#sales"
                  role="tab"
                  aria-selected="false"
                >
                  <Image src="assets/img/icons/sales1.svg" alt />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  to="#reports"
                  id="report-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#purchase"
                  role="tab"
                  aria-selected="true"
                >
                  <Image src="assets/img/icons/purchase1.svg" alt />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  to="#set"
                  id="set-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#user"
                  role="tab"
                  aria-selected="true"
                >
                  <Image src="assets/img/icons/users1.svg" alt />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link active"
                  to="#set3"
                  id="set-tab3"
                  data-bs-toggle="tab"
                  data-bs-target="#report"
                  role="tab"
                  aria-selected="true"
                >
                  <Image src="assets/img/icons/printer.svg" alt="" />
                </Link>
              </li>
              <li className="nav-item" role="presentation">
                <Link
                  className="tablinks nav-link"
                  to="#set5"
                  id="set-tab6"
                  data-bs-toggle="tab"
                  data-bs-target="#permission"
                  role="tab"
                  aria-selected="true"
                >
                  <i data-feather="file-text" />
                </Link>
              </li>
            </ul>
          </aside>
          <div className="tab-content tab-content-four pt-2">
            <ul className="tab-pane" id="home" aria-labelledby="home-tab">
              <li className="submenu">
                <Link
                  to="#"
                  onClick={handleSelectClick}
                  className={isActive ? "subdrop" : ""}
                >
                  <span>Dashboard</span> <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive ? "block" : "none" }}>
                  <li>
                    <Link to="index">Admin Dashboard</Link>
                  </li>
                  <li>
                    <Link to="sales-dashboard">Sales Dashboard</Link>
                  </li>
                </ul>
              </li>
              
            </ul>
            <ul
              className="tab-pane"
              id="product"
              aria-labelledby="messages-tab"
            >
              <li>
                <Link to="product-list">
                  <span>Products</span>
                </Link>
              </li>
              <li>
                <Link to="add-product">
                  <span>Create Product</span>
                </Link>
              </li>
              <li>
                <Link to="expired-products">
                  <span>Expired Products</span>
                </Link>
              </li>
              <li>
                <Link to="low-stocks">
                  <span>Low Stocks</span>
                </Link>
              </li>
              <li>
                <Link to="category-list">
                  <span>Category</span>
                </Link>
              </li>
              <li>
                <Link to="sub-categories">
                  <span>Sub Category</span>
                </Link>
              </li>
              <li>
                <Link to="brand-list">
                  <span>Brands</span>
                </Link>
              </li>
              <li>
                <Link to="units">
                  <span>Units</span>
                </Link>
              </li>
              <li>
                <Link to="varriant-attributes">
                  <span>Variant Attributes</span>
                </Link>
              </li>
              <li>
                <Link to="warranty">
                  <span>Warranties</span>
                </Link>
              </li>
              <li>
                <Link to="barcode">
                  <span>Print Barcode</span>
                </Link>
              </li>
              <li>
                <Link to="qrcode">
                  <span>Print QR Code</span>
                </Link>
              </li>
            </ul>
            <ul className="tab-pane" id="sales" aria-labelledby="profile-tab">
              <li>
                <Link to="sales-list">
                  <span>Sales</span>
                </Link>
              </li>
              {/* <li>
                <Link to="invoice-report">
                  <span>Invoices</span>
                </Link>
              </li> */}
              <li>
                <Link to="sales-returns">
                  <span>Sales Return</span>
                </Link>
              </li>
              {/* <li>
                <Link to="quotation-list">
                  <span>Quotation</span>
                </Link>
              </li> */}
              <li>
                <Link to="pos">
                  <span>POS</span>
                </Link>
              </li>
              <li>
                <Link to="coupons">
                  <span>Coupons</span>
                </Link>
              </li>
            </ul>
            <ul className="tab-pane" id="purchase" aria-labelledby="report-tab">
              <li>
                <Link to="purchase-list">
                  <span>Purchases</span>
                </Link>
              </li>
              <li>
                <Link to="purchase-order-report">
                  <span>Purchase Order</span>
                </Link>
              </li>
              <li>
                <Link to="purchase-returns">
                  <span>Purchase Return</span>
                </Link>
              </li>
              <li>
                <Link to="manage-stocks">
                  <span>Manage Stock</span>
                </Link>
              </li>
              <li>
                <Link to="stock-adjustment">
                  <span>Stock Adjustment</span>
                </Link>
              </li>
              <li>
                <Link to="stock-transfer">
                  <span>Stock Transfer</span>
                </Link>
              </li>
              <li className="submenu">
                <Link
                  to="#"
                  onClick={handleSelectClick3}
                  className={isActive3 ? "subdrop" : ""}
                >
                  <span>Expenses</span>
                  <span className="menu-arrow" />
                </Link>
                <ul style={{ display: isActive3 ? "block" : "none" }}>
                  <li>
                    <Link to="expense-list">Expenses</Link>
                  </li>
                  <li>
                    <Link to="expense-category">Expense Category</Link>
                  </li>
                </ul>
              </li>
            </ul>
            <ul className="tab-pane" id="user" aria-labelledby="set-tab">
              <li>
                <Link to="customers">
                  <span>Customers</span>
                </Link>
              </li>
              <li>
                <Link to="suppliers">
                  <span>Suppliers</span>
                </Link>
              </li>
              <li>
                <Link to="store-list">
                  <span>Stores</span>
                </Link>
              </li>
              <li>
                <Link to="warehouse">
                  <span>Warehouses</span>
                </Link>
              </li>
            </ul>
            <ul
              className="tab-pane active"
              id="report"
              aria-labelledby="set-tab3"
            >
              <li>
                <Link to="sales-report">
                  <span>Sales Report</span>
                </Link>
              </li>
              <li>
                <Link to="purchase-report">
                  <span>Purchase report</span>
                </Link>
              </li>
              <li>
                <Link to="inventory-report">
                  <span>Inventory Report</span>
                </Link>
              </li>
              
              <li>
                <Link to="expense-report" className="active">
                  <span>Expense Report</span>
                </Link>
              </li>
              <li>
                <Link to="income-report">
                  <span>Income Report</span>
                </Link>
              </li>
              <li>
                <Link to="profit-and-loss">
                  <span>Profit &amp; Loss</span>
                </Link>
              </li>
            </ul>
            <ul className="tab-pane" id="permission" aria-labelledby="set-tab4">
              <li>
                <Link to="users">
                  <span>Users</span>
                </Link>
              </li>
              <li>
                <Link to="roles-permissions">
                  <span>Roles &amp; Permissions</span>
                </Link>
              </li>
              <li>
                <Link to="delete-account">
                  <span>Delete Account Request</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollapsedSidebar;
