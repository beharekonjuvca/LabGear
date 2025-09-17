import { useMemo, useState } from "react";
import { Layout as AntLayout, Menu, Button, Avatar, Grid, theme } from "antd";
import {
  DashboardOutlined,
  CalendarOutlined,
  AppstoreOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  SearchOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { clearAuth, getUser, isStaffOrAdmin } from "../utils/auth";

const { Header, Content, Sider } = AntLayout;
const { useToken } = theme;
const { useBreakpoint } = Grid;

export default function Layout({ children }) {
  const navigate = useNavigate();
  const loc = useLocation();
  const user = getUser();
  const isStaff = isStaffOrAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const screens = useBreakpoint();
  const { token } = useToken();

  const isMobile = !screens.lg;

  const mainMenuItems = useMemo(() => {
    const items = [
      {
        key: "/",
        icon: <DashboardOutlined />,
        label: <Link to="/">Dashboard</Link>,
      },
      {
        key: "/reservations",
        icon: <CalendarOutlined />,
        label: <Link to="/reservations">Reservations</Link>,
      },
      {
        key: "/browse",
        icon: <SearchOutlined />,
        label: <Link to="/browse">Browse</Link>,
      },
    ];
    if (isStaff) {
      items.push(
        {
          key: "/items",
          icon: <AppstoreOutlined />,
          label: <Link to="/items">Items</Link>,
        },
        {
          key: "/loans",
          icon: <BookOutlined />,
          label: <Link to="/loans">Loans</Link>,
        }
      );
    }
    return items;
  }, [isStaff]);

  const profileItem = useMemo(
    () => [
      {
        key: "/profile",
        icon: <UserOutlined />,
        label: <Link to="/profile">Profile</Link>,
      },
    ],
    []
  );

  return (
    <AntLayout style={{ minHeight: "100vh", background: token.colorBgLayout }}>
      <Sider
        theme="light"
        breakpoint="lg"
        collapsible
        collapsed={collapsed}
        collapsedWidth={isMobile ? 0 : 64}
        onBreakpoint={(broken) => {
          setCollapsed(broken ? true : false);
        }}
        trigger={null}
        width={240}
        style={{
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          height: "100vh",
          position: isMobile ? "fixed" : "sticky",
          insetInlineStart: 0,
          top: 0,
          zIndex: 1001,
        }}
      >
        <div
          className="px-4 py-4 font-bold"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Avatar
            shape="square"
            size={28}
            style={{ background: token.colorPrimary }}
          >
            L
          </Avatar>
          {!(collapsed || isMobile) && <span>LabGear</span>}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[loc.pathname]}
          items={mainMenuItems}
          style={{ borderInlineEnd: "none" }}
        />

        <div
          style={{
            marginTop: "auto",
            padding: 12,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[loc.pathname]}
            items={profileItem}
            style={{ borderInlineEnd: "none" }}
          />
        </div>
      </Sider>

      <AntLayout>
        <Header
          style={{
            padding: "0 12px",
            background:
              "linear-gradient(90deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))",
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 900,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed((c) => !c)}
            />
            <Avatar size={32} icon={<UserOutlined />} />
            <div className="hidden md:block">
              <span className="font-semibold">
                Hello{user ? `, ${user.full_name}` : ""}
              </span>
            </div>
          </div>

          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => {
              clearAuth();
              navigate("/login");
            }}
          >
            Logout
          </Button>
        </Header>

        <Content
          style={{
            margin: 0,
            padding: isMobile ? 12 : 24,
            paddingLeft: isMobile ? 12 : collapsed ? 24 : 24,
            background:
              "linear-gradient(180deg, rgba(250,250,250,1) 0%, rgba(250,250,250,1) 40%, rgba(255,255,255,1) 100%)",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              background: token.colorBgContainer,
              borderRadius: 12,
              padding: isMobile ? 12 : 20,
              boxShadow:
                "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
              minHeight: "calc(100vh - 140px)",
            }}
          >
            {children}
          </div>
        </Content>
        {isMobile && !collapsed && (
          <div
            onClick={() => setCollapsed(true)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              zIndex: 1000,
            }}
          />
        )}
      </AntLayout>
    </AntLayout>
  );
}
