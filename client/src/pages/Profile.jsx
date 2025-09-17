import { useEffect, useState } from "react";
import { Card, Form, Input, Button, Divider, message } from "antd";
import Layout from "../components/Layout";
import UserAPI from "../api/user";
import { getUser, setAuth } from "../utils/auth";

export default function Profile() {
  const [formInfo] = Form.useForm();
  const [formPw] = Form.useForm();
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingPw, setLoadingPw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const u = await UserAPI.me();
        formInfo.setFieldsValue({ full_name: u.fullName, email: u.email });
      } catch {
        // ignore
      }
    })();
  }, []);

  const saveInfo = async (vals) => {
    setLoadingInfo(true);
    try {
      const res = await UserAPI.update({
        full_name: vals.full_name,
        email: vals.email,
      });
      const cached = getUser() || {};
      setAuth({
        user: {
          ...cached,
          full_name: res.user.fullName,
          email: res.user.email,
        },
      });
      message.success("Profile updated");
    } catch (e) {
      message.error(e?.response?.data?.message || "Update failed");
    } finally {
      setLoadingInfo(false);
    }
  };

  const changePassword = async (vals) => {
    setLoadingPw(true);
    try {
      await UserAPI.update({
        current_password: vals.current_password,
        new_password: vals.new_password,
      });
      formPw.resetFields();
      message.success("Password updated");
    } catch (e) {
      message.error(e?.response?.data?.message || "Password change failed");
    } finally {
      setLoadingPw(false);
    }
  };

  return (
    <Layout>
      <Card title="Profile">
        <Form
          form={formInfo}
          layout="vertical"
          onFinish={saveInfo}
          className="max-w-xl"
        >
          <Form.Item
            name="full_name"
            label="Full name"
            rules={[{ required: true, min: 2 }]}
          >
            <Input placeholder="Your name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true }, { type: "email" }]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loadingInfo}>
            Save
          </Button>
        </Form>

        <Divider />

        <Form
          form={formPw}
          layout="vertical"
          onFinish={changePassword}
          className="max-w-xl"
        >
          <Form.Item
            name="current_password"
            label="Current password"
            rules={[{ required: true }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="new_password"
            label="New password"
            rules={[{ required: true, min: 6 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="Confirm new password"
            dependencies={["new_password"]}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, v) {
                  if (!v || getFieldValue("new_password") === v)
                    return Promise.resolve();
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loadingPw}>
            Change password
          </Button>
        </Form>
      </Card>
    </Layout>
  );
}
