import { Layout as AntLayout, Menu } from "antd";
import { Link, useNavigate } from "react-router-dom";

const { Header, Content, Sider } = AntLayout;

export default function Layout({ children }) {
  const navigate = useNavigate();

  const items = [
    { key: "dashboard", label: <Link to="/">Dashboard</Link> },
    { key: "items", label: <Link to="/items">Items</Link> },
    {
      key: "reservations",
      label: <Link to="/reservations">Reservations</Link>,
    },
    { key: "loans", label: <Link to="/loans">Loans</Link> },
  ];

  return (
    <AntLayout style={{ minHeight: "100vh" }}>
      <Sider theme="light">
        <Menu mode="inline" defaultSelectedKeys={["dashboard"]} items={items} />
      </Sider>
      <AntLayout>
        <Header style={{ background: "#fff", padding: "0 16px" }}>
          <span className="font-bold">LabGear</span>
          <button
            className="float-right"
            onClick={() => {
              localStorage.clear();
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
