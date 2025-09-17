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
import LoansAPI from "../api/loans";
import ReservationsAPI from "../api/reservations";
import Layout from "../components/Layout";

export default function Loans() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [approvedReservations, setApprovedReservations] = useState([]);
  const [form] = Form.useForm();

  const load = async (status) => {
    setLoading(true);
    try {
      const res = await LoansAPI.list(status);
      setRows(res.data || []);
    } catch {
      message.error("Failed to load loans");
    } finally {
      setLoading(false);
    }
  };

  const loadApproved = async () => {
    try {
      const r = await ReservationsAPI.listApproved();
      setApprovedReservations(r);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    load();
    loadApproved();
  }, []);

  const statusTag = (s) => {
    const map = { ACTIVE: "processing", RETURNED: "success", OVERDUE: "error" };
    return <Tag color={map[s] || "default"}>{s}</Tag>;
  };

  const columns = useMemo(
    () => [
      { title: "ID", dataIndex: "id", width: 70 },
      {
        title: "Reservation",
        dataIndex: "reservationId",
        width: 120,
        render: (v) => v ?? "-",
      },
      { title: "Item", dataIndex: "itemId", width: 90 },
      { title: "User", dataIndex: "userId", width: 90 },
      {
        title: "Checkout",
        dataIndex: "checkoutAt",
        render: (v) => new Date(v).toLocaleString(),
      },
      {
        title: "Due",
        dataIndex: "dueAt",
        render: (v) => new Date(v).toLocaleString(),
      },
      {
        title: "Returned",
        dataIndex: "returnedAt",
        render: (v) => (v ? new Date(v).toLocaleString() : "-"),
      },
      { title: "Status", dataIndex: "status", render: statusTag, width: 120 },
      {
        title: "Actions",
        width: 160,
        render: (_, r) => (
          <Space>
            <Button
              disabled={r.status !== "ACTIVE"}
              onClick={() => returnLoan(r.id)}
            >
              Return
            </Button>
          </Space>
        ),
      },
    ],
    []
  );

  const returnLoan = async (id) => {
    try {
      await LoansAPI.returnLoan(id);
      message.success("Returned");
      load();
    } catch (e) {
      if (e?.response?.status === 403)
        message.error("Forbidden (need STAFF/ADMIN)");
      else message.error("Return failed");
    }
  };

  const submit = async () => {
    try {
      const vals = await form.validateFields();
      await LoansAPI.create({
        reservation_id: vals.reservation_id,
        due_at: vals.due_at.toDate().toISOString(),
      });
      message.success("Loan created");
      setOpen(false);
      form.resetFields();
      load();
      // refresh approved list because this reservation becomes CONVERTED
      loadApproved();
    } catch (e) {
      if (e?.response?.status === 404) message.error("Reservation not found");
      else if (e?.response?.status === 403)
        message.error("Forbidden (need STAFF/ADMIN)");
      else message.error("Create failed");
    }
  };

  return (
    <Layout>
      <Card
        title="Loans"
        extra={
          <Button type="primary" onClick={() => setOpen(true)}>
            Checkout (from Reservation)
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
          title="Checkout Item"
          onCancel={() => setOpen(false)}
          onOk={submit}
          okText="Create Loan"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="reservation_id"
              label="Approved Reservation"
              rules={[{ required: true }]}
            >
              <Select
                placeholder="Select approved reservation"
                options={approvedReservations.map((r) => ({
                  value: r.id,
                  label: `#${r.id} — Item ${r.itemId} — ${new Date(
                    r.startDate
                  ).toLocaleDateString()} → ${new Date(
                    r.endDate
                  ).toLocaleDateString()}`,
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
              name="due_at"
              label="Due date & time"
              rules={[{ required: true, message: "Pick due date" }]}
            >
              <DatePicker showTime />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </Layout>
  );
}
