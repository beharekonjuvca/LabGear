import { Layout as AntLayout, Menu } from "antd";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getUser, isStaffOrAdmin } from "../utils/auth";

const { Header, Content, Sider } = AntLayout;

export default function Layout({ children }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const user = getUser();
  const isStaff = isStaffOrAdmin();

  const items = [
    { key: "/", label: <Link to="/">Dashboard</Link> },
    {
      key: "/reservations",
      label: <Link to="/reservations">Reservations</Link>,
    },
    { key: "/browse", label: <Link to="/browse">Browse</Link> },
    ...(isStaff
      ? [
          { key: "/items", label: <Link to="/items">Items</Link> },
          { key: "/loans", label: <Link to="/loans">Loans</Link> },
        ]
      : []),
  ];

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider theme="light">
        <div className="p-4 font-bold">LabGear</div>
        <Menu mode="inline" selectedKeys={[loc.pathname]} items={items} />
      </Sider>
      <AntLayout>
        <Header style={{ background: "#fff", padding: "0 16px" }}>
          <span className="font-semibold">
            Hello{user ? `, ${user.full_name}` : ""}
          </span>
          <button
            className="float-right"
            onClick={() => {
              clearAuth();
              navigate("/login");
            }}
          >
            Logout
          </button>
        </Header>
        <Content style={{ margin: "16px" }}>{children}</Content>
      </AntLayout>
    </AntLayout>
  );
}
