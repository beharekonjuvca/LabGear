import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Items from "./pages/Items.jsx";
import Reservations from "./pages/Reservations.jsx";
import Loans from "./pages/Loans.jsx";
import { getUser, isStaffOrAdmin } from "./utils/auth";
import ItemsBrowse from "./pages/ItemsBrowse.jsx";
import Profile from "./pages/Profile.jsx";

function PrivateRoute({ children }) {
  const t = localStorage.getItem("accessToken");
  return t ? children : <Navigate to="/login" />;
}

function StaffOnly({ children }) {
  return isStaffOrAdmin() ? children : <Navigate to="/" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        {/* Members can see Reservations; Actions are gated in the page */}
        <Route
          path="/reservations"
          element={
            <PrivateRoute>
              <Reservations />
            </PrivateRoute>
          }
        />
        {/* Staff/Admin only */}
        <Route
          path="/items"
          element={
            <PrivateRoute>
              <StaffOnly>
                <Items />
              </StaffOnly>
            </PrivateRoute>
          }
        />
        <Route
          path="/loans"
          element={
            <PrivateRoute>
              <StaffOnly>
                <Loans />
              </StaffOnly>
            </PrivateRoute>
          }
        />
        <Route
          path="/browse"
          element={
            <PrivateRoute>
              <ItemsBrowse />
            </PrivateRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
