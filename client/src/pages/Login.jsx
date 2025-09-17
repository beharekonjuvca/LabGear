import { useState } from "react";
import { Form, Input, Button, Card } from "antd";
import api from "../api/axios.js";

export default function Login() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (vals) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", vals);
      localStorage.setItem("accessToken", res.data.accessToken);
      window.location.href = "/";
    } catch (e) {
      alert("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Card title="Login" style={{ width: 300 }}>
        <Form onFinish={onFinish}>
          <Form.Item name="email" rules={[{ required: true }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true }]}>
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form>
      </Card>
    </div>
  );
}
