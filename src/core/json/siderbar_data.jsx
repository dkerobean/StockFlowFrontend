import React from 'react';

import * as Icon from 'react-feather';

export const SidebarData = [

    {
        label: "Main",
        submenuOpen: true,
        showSubRoute: false,
        submenuHdr: "Main",
        submenuItems: [
        {
            label: "Dashboard",
            icon: <Icon.Grid  />,
            submenu: true,
            showSubRoute: false,

            submenuItems: [
              { label: "Admin Dashboard", link: "/" },
              { label: "Sales Dashboard", link: "/sales-dashboard" }
            ]
          },
          
        ]
      },
      {
        label: "Inventory",
        submenuOpen: true,
        showSubRoute: false,
        submenuHdr: "Inventory",

        submenuItems: [
          { label: "Products", link: "/product-list", icon:<Icon.Box />,showSubRoute: false,submenu: false },
          { label: "Create Product", link: "/add-product", icon:  <Icon.PlusSquare />,showSubRoute: false, submenu: false },
          { label: "Expired Products", link: "/expired-products", icon:  <Icon.Codesandbox  />,showSubRoute: false,submenu: false },
          { label: "Low Stocks", link: "/low-stocks", icon: <Icon.TrendingDown  />,showSubRoute: false,submenu: false },
          { label: "Category", link: "/category-list", icon:  <Icon.Codepen />,showSubRoute: false,submenu: false },
          { label: "Brands", link: "/brand-list", icon:  <Icon.Tag />,showSubRoute: false,submenu: false },
          { label: "Print Barcode", link: "/barcode", icon: <Icon.AlignJustify />, showSubRoute: false,submenu: false },
          { label: "Print QR Code", link: "/qrcode", icon:  <Icon.Maximize  />,showSubRoute: false,submenu: false }
        ]
      },
      {
        label: "Stock",
        submenuOpen: true,
        submenuHdr: "Stock",
        submenu: true,
        showSubRoute: false,
        submenuItems: [
          { label: "Manage Stock", link: "/manage-stocks", icon:  <Icon.Package />,showSubRoute: false,submenu: false },
          { label: "Stock Adjustment", link: "/stock-adjustment", icon:  <Icon.Clipboard />,showSubRoute: false,submenu: false },
          { label: "Stock Transfer", link: "/stock-transfer", icon:  <Icon.Truck />,showSubRoute: false,submenu: false }
        ]
      },
      {
        label: "Sales",
        submenuOpen: true,
        submenuHdr: "Sales",
        submenu: false,
        showSubRoute: false,
        submenuItems: [
          { label: "Sales", link: "/sales-list", icon:  <Icon.ShoppingCart />,showSubRoute: false,submenu: false },
          // { label: "Invoices", link: "/invoice-report", icon:  <Icon.FileText />,showSubRoute: false,submenu: false },
          { label: "Sales Return", link: "/sales-returns", icon:  <Icon.Copy />,showSubRoute: false,submenu: false },
          // { label: "Quotation", link: "/quotation-list", icon:  <Icon.Save />,showSubRoute: false,submenu: false },
          { label: "POS", link: "/pos", icon:  <Icon.HardDrive />,showSubRoute: false,submenu: false }
        ]
      },
      // {
      //   label: "Promo",
      //   submenuOpen: true,
      //   submenuHdr: "Promo",
      //   showSubRoute: false,
      //   submenuItems: [
      //     { label: "Coupons", link: "/coupons", icon:  <Icon.ShoppingCart />,showSubRoute: false, submenu: false }
      //   ]
      // },
      {
        label: "Purchases",
        submenuOpen: true,
        submenuHdr: "Purchases",
        showSubRoute: false,
        submenuItems: [
          { label: "Purchases", link: "/purchase-list", icon:  <Icon.ShoppingBag />,showSubRoute: false,submenu: false },
          { label: "Purchase Order", link: "/purchase-order-report", icon:  <Icon.FileMinus />,showSubRoute: false ,submenu: false},
          { label: "Purchase Return", link: "/purchase-returns", icon:  <Icon.RefreshCw />,showSubRoute: false,submenu: false }
        ]
      },



    {
        label: "Finance & Accounts",
        submenuOpen: true,
        showSubRoute: false,
        submenuHdr: "Finance & Accounts",
        submenuItems: [
          {
            label: "Expenses",
            submenu: true,
            showSubRoute: false,
            icon: <Icon.FileText />,
            submenuItems: [
              {label: "Expenses", link: "/expense-list",showSubRoute: false},
              {label: "Expense Category", link: "/expense-category",showSubRoute: false}
            ]
          },
          {
            label: "Income",
            submenu: true,
            showSubRoute: false,
            icon: <Icon.DollarSign />,
            submenuItems: [
              {label: "Income", link: "/income-list",showSubRoute: false},
              {label: "Income Category", link: "/income-category",showSubRoute: false}
            ]
          }
        ]
      },

      {
        label: "People",
        submenuOpen: true,
        showSubRoute: false,
        submenuHdr: "People",

        submenuItems: [
          { label: "Customers", link: "/customers", icon:<Icon.User />,showSubRoute: false,submenu: false },
          { label: "Suppliers", link: "/suppliers", icon:  <Icon.Users />,showSubRoute: false, submenu: false },
          { label: "Stores", link: "/store-list", icon:  <Icon.Home  />,showSubRoute: false,submenu: false },
          { label: "Warehouses", link: "/warehouse", icon: <Icon.Archive />,showSubRoute: false,submenu: false },

        ]
      },

      {
        label: "Reports",
        submenuOpen: true,
        showSubRoute: false,
        submenuHdr: "Reports",
        submenuItems: [
          { label: "Sales Report", link: "/sales-report", icon:  <Icon.BarChart2 /> ,showSubRoute: false},
          { label: "Purchase Report", link: "/purchase-report", icon:  <Icon.PieChart />,showSubRoute: false },
          { label: "Inventory Report", link: "/inventory-report", icon:  <Icon.Inbox />,showSubRoute: false },
          
          { label: "Expense Report", link: "/expense-report", icon:  <Icon.FileText />,showSubRoute: false },
          { label: "Income Report", link: "/income-report", icon:  <Icon.BarChart />,showSubRoute: false },
          { label: "Profit & Loss", link: "/profit-loss-report", icon:  <Icon.TrendingDown />,showSubRoute: false }
        ],
      },


      {
        label: "User Management",
        submenuOpen: true,
        showSubRoute: false,
        submenuHdr: "User Management",
        submenuItems: [
          { label: "Users", link: "/users", icon:  <Icon.UserCheck />,showSubRoute: false },
          { label: "Roles & Permissions", link: "/roles-permissions", icon:  <Icon.UserCheck />,showSubRoute: false },
          { label: "Delete Account Request", link: "/delete-account", icon:  <Icon.Lock />,showSubRoute: false }
        ]
      },






]
