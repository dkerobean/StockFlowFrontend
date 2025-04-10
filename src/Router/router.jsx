import React from "react";
import { Route, Routes, Outlet } from "react-router-dom"; // Import Outlet if not already
import Header from "../InitialPage/Sidebar/Header";
import Sidebar from "../InitialPage/Sidebar/Sidebar";
import { pagesRoute, posRoutes, publicRoutes } from "./router.link";
import { useSelector } from "react-redux";
import ThemeSettings from "../InitialPage/themeSettings";
import Loader from "../feature-module/loader/loader";
// --- Import the ProtectedRoute component ---
import ProtectedRoute from "./ProtectedRoute"; // Adjust the path if necessary
// --- Import your routes if needed for redirection fallback or specific routes ---
// import { all_routes } from "./all_routes";

// --- Layout Components ---

// Layout for main application pages (protected)
const HeaderLayout = () => {
  const data = useSelector((state) => state.toggle_header);
  return (
    <div className={`main-wrapper ${data ? "header-collapse" : ""}`}>
      <Header />
      <Sidebar />
      <Outlet /> {/* Nested routes render here */}
      <ThemeSettings />
      <Loader />
    </div>
  );
};

// Layout for Authentication pages (public)
const AuthpagesLayout = () => {
  const data = useSelector((state) => state.toggle_header); // Check if needed here
  return (
    <div className={data ? "header-collapse" : ""}>
      <Outlet /> {/* Signin, Register etc. render here */}
      <Loader />
      <ThemeSettings />
    </div>
  );
};

// Layout for POS pages (protected)
const PospagesLayout = () => {
  return (
    <div>
      <Header /> {/* Consider if POS needs a different header */}
      <Outlet /> {/* Nested POS routes render here */}
      <Loader />
      <ThemeSettings />
    </div>
  );
};

// --- Main Router Component ---
const AllRoutes = () => {
  // Assuming publicRoutes are actually the protected routes inside the main app layout
  console.log("Protected App Routes (publicRoutes):", publicRoutes);
  // Assuming pagesRoute are the public auth routes (signin, register)
  console.log("Public Auth Routes (pagesRoute):", pagesRoute);
  // Assuming posRoutes are protected routes inside the POS layout
  console.log("Protected POS Routes (posRoutes):", posRoutes);

  return (
    // No need for the outer div here unless for specific styling
    <Routes>

      {/* --- Authentication Routes (Public) --- */}
      {/* Routes under this element are accessible without login */}
      <Route element={<AuthpagesLayout />}>
        {pagesRoute.map((route, id) => (
          <Route path={route.path} element={route.element} key={`auth-${id}`} />
        ))}
        {/* Example: Explicitly define signin if not in pagesRoute */}
        {/* <Route path={all_routes.signin} element={<Signin />} /> */}
      </Route>

      {/* --- Protected Main Application Routes --- */}
      {/* Wrap the entire layout route with ProtectedRoute */}
      {/* Any route nested under this will require authentication */}
      <Route element={<ProtectedRoute><HeaderLayout /></ProtectedRoute>}>
        {/* Assuming publicRoutes define paths like '/dashboard', '/settings' */}
        {publicRoutes.map((route, id) => (
          <Route path={route.path} element={route.element} key={`main-${id}`} />
        ))}
        {/* Example: If your dashboard is at '/' for logged-in users */}
        {/* <Route path="/" element={<DashboardComponent />} /> */}
      </Route>

      {/* --- Protected POS Routes --- */}
      {/* Wrap the entire POS layout route with ProtectedRoute */}
      {/* Any route nested under this will also require authentication */}
       {/* Ensure the path here is distinct or structure routes carefully */}
      <Route path="/pos" element={<ProtectedRoute><PospagesLayout /></ProtectedRoute>}>
        {/* Assuming posRoutes define paths relative to /pos or absolute paths like '/pos/checkout' */}
        {posRoutes.map((route, id) => (
           // If route.path is relative (e.g., 'checkout'), it becomes '/pos/checkout'
           // If route.path is absolute (e.g., '/pos/checkout'), it maps directly
           // Ensure your route definitions match how paths are structured here
          <Route path={route.path} element={route.element} key={`pos-${id}`} />
        ))}
         {/* Example: Index route for /pos */}
         {/* <Route index element={<PosDashboardComponent />} /> */}
      </Route>

      {/* --- Optional: Redirect root path or handle 404 --- */}
      {/* If '/' should redirect to signin when logged out, ProtectedRoute handles it */}
      {/* If '/' should be dashboard when logged in, ensure it's defined within the protected HeaderLayout routes */}
      {/* Add a 404 Not Found Route at the end */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
};
export default AllRoutes;