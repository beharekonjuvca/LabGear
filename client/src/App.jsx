import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppLoader from "./components/AppLoader.jsx";
import { isStaffOrAdmin } from "./utils/auth";

const Login = lazy(() => import("./pages/Login.jsx"));
const Register = lazy(() => import("./pages/Register.jsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.jsx"));
const Items = lazy(() => import("./pages/Items.jsx"));
const Reservations = lazy(() => import("./pages/Reservations.jsx"));
const Loans = lazy(() => import("./pages/Loans.jsx"));
const ItemsBrowse = lazy(() => import("./pages/ItemsBrowse.jsx"));
const Profile = lazy(() => import("./pages/Profile.jsx"));

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
      <Suspense fallback={<AppLoader />}>
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

          <Route
            path="/reservations"
            element={
              <PrivateRoute>
                <Reservations />
              </PrivateRoute>
            }
          />

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

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
