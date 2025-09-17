import { useState } from "react";
import { Form, Input, Button, Card, message } from "antd";
import api from "../api/axios";
import { setAuth } from "../utils/auth";

export default function Login() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (vals) => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", vals);
      setAuth(data); // store accessToken + user
      message.success("Welcome!");
      window.location.href = "/";
    } catch {
      message.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Card title="Login" style={{ width: 320 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true }]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
          <div className="mt-2 text-sm">
            New here? <a href="/register">Create account</a>
          </div>
        </Form>
      </Card>
    </div>
  );
}
