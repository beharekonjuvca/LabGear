import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Layout from "../components/Layout.jsx";
import { Table, Button, Modal, Form, Input } from "antd";

export default function Items() {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = () => api.get("/items").then((r) => setData(r.data.data));
  useEffect(() => {
    fetchData();
  }, []);

  const onFinish = async (vals) => {
    await api.post("/items", vals);
    setOpen(false);
    fetchData();
  };

  return (
    <Layout>
      <Button type="primary" onClick={() => setOpen(true)}>
        Add Item
      </Button>
      <Table
        rowKey="id"
        dataSource={data}
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "Name", dataIndex: "name" },
          { title: "Code", dataIndex: "code" },
          { title: "Category", dataIndex: "category" },
          {
            title: "Available",
            dataIndex: "available",
            render: (v) => (v ? "Yes" : "No"),
          },
        ]}
      />
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        title="Add Item"
      >
        <Form form={form} onFinish={onFinish}>
          <Form.Item name="name" rules={[{ required: true }]}>
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item name="code" rules={[{ required: true }]}>
            <Input placeholder="Code" />
          </Form.Item>
          <Form.Item name="category" rules={[{ required: true }]}>
            <Input placeholder="Category" />
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
