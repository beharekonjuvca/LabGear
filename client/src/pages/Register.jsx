import { Card, Form, Input, Button, message } from "antd";
import api from "../api/axios";
import { setAuth } from "../utils/auth";

export default function Register() {
  const [form] = Form.useForm();

  const onFinish = async (vals) => {
    try {
      await api.post("/auth/register", {
        email: vals.email,
        password: vals.password,
        full_name: vals.full_name,
      });

      const { data } = await api.post("/auth/login", {
        email: vals.email,
        password: vals.password,
      });
      setAuth(data);
      message.success("Registered & logged in!");
      window.location.href = "/";
    } catch (e) {
      message.error(e?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <Card title="Create account" style={{ width: 380 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="full_name"
            label="Full name"
            rules={[
              { required: true, message: "Name is required" },
              { min: 2 },
            ]}
          >
            <Input placeholder="Jane Doe" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true },
              { min: 6, message: "Min 6 characters" },
            ]}
            hasFeedback
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            name="confirm"
            label="Confirm password"
            dependencies={["password"]}
            hasFeedback
            rules={[
              { required: true, message: "Please confirm" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value)
                    return Promise.resolve();
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Create account
          </Button>
          <div className="mt-2 text-sm">
            Already have an account? <a href="/login">Log in</a>
          </div>
        </Form>
      </Card>
    </div>
  );
}
