import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
} from "antd";
import ReservationsAPI from "../api/reservations";
import ItemsAPI from "../api/items";
import Layout from "../components/Layout";

export default function Reservations() {
  const [rows, setRows] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await ReservationsAPI.list();
      setRows(res.data || []);
    } catch (e) {
      message.error("Failed to load reservations");
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const data = await ItemsAPI.listAllSimple();
      setItems(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
    loadItems();
  }, []);

  const statusTag = (s) => {
    const map = {
      PENDING: "default",
      APPROVED: "processing",
      CANCELLED: "error",
      CONVERTED: "success",
    };
    return <Tag color={map[s] || "default"}>{s}</Tag>;
  };

  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", width: 70 },
      { title: "Item ID", dataIndex: "itemId", width: 90 },
      { title: "User ID", dataIndex: "userId", width: 90 },
      {
        title: "Start",
        dataIndex: "startDate",
        render: (v) => new Date(v).toLocaleString(),
      },
      {
        title: "End",
        dataIndex: "endDate",
        render: (v) => new Date(v).toLocaleString(),
      },
      { title: "Status", dataIndex: "status", render: statusTag, width: 130 },
      {
        title: "Actions",
        width: 220,
        render: (_, r) => (
          <Space>
            <Button
              disabled={!(r.status === "PENDING")}
              onClick={() => approve(r.id)}
            >
              Approve
            </Button>
            <Button
              danger
              disabled={!(r.status === "PENDING" || r.status === "APPROVED")}
              onClick={() => cancel(r.id)}
            >
              Cancel
            </Button>
          </Space>
        ),
      },
    ],
    []
  );

  const approve = async (id) => {
    try {
      await ReservationsAPI.approve(id);
      message.success("Approved");
      load();
    } catch (e) {
      if (e?.response?.status === 403)
        message.error("Forbidden (need STAFF/ADMIN)");
      else message.error("Approve failed");
    }
  };

  const cancel = async (id) => {
    try {
      await ReservationsAPI.cancel(id);
      message.success("Cancelled");
      load();
    } catch (e) {
      if (e?.response?.status === 403)
        message.error("Forbidden (need STAFF/ADMIN)");
      else message.error("Cancel failed");
    }
  };

  const submit = async () => {
    try {
      const vals = await form.validateFields();
      const [start, end] = vals.range;
      await ReservationsAPI.create({
        item_id: vals.item_id,
        start_date: start.toDate().toISOString(),
        end_date: end.toDate().toISOString(),
      });
      message.success("Reservation created");
      setOpen(false);
      form.resetFields();
      load();
    } catch (e) {
      if (e?.response?.status === 409) {
        message.error("Item already reserved in that range");
      } else if (e?.response?.status === 401) {
        message.error("Please login again");
      } else if (e?.errorFields) {
        // form validation issue
      } else {
        message.error("Create failed");
      }
    }
  };

  return (
    <Layout>
      <Card
        title="Reservations"
        extra={
          <Button type="primary" onClick={() => setOpen(true)}>
            New Reservation
          </Button>
        }
      >
        <Table
          rowKey="id"
          dataSource={rows}
          columns={columns}
          loading={loading}
        />

        <Modal
          open={open}
          title="New Reservation"
          onCancel={() => setOpen(false)}
          onOk={submit}
          okText="Create"
        >
          <Form form={form} layout="vertical">
            <Form.Item name="item_id" label="Item" rules={[{ required: true }]}>
              <Select
                placeholder="Select item"
                options={items.map((i) => ({
                  value: i.id,
                  label: `${i.name} (${i.code})`,
                }))}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? "")
                    .toLowerCase()
                    .includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item
              name="range"
              label="Date range"
              rules={[{ required: true, message: "Pick start and end date" }]}
            >
              <DatePicker.RangePicker showTime />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </Layout>
  );
}
