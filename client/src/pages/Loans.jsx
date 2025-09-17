import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  message,
  Grid,
  Row,
  Col,
} from "antd";
import dayjs from "dayjs";

import LoansAPI from "../api/loans";
import ReservationsAPI from "../api/reservations";
import Layout from "../components/Layout";

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function Loans() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState();
  const [q, setQ] = useState("");
  const [range, setRange] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [open, setOpen] = useState(false);
  const [approvedReservations, setApprovedReservations] = useState([]);
  const [selectedRes, setSelectedRes] = useState(null);
  const [form] = Form.useForm();

  const load = async (opts = {}) => {
    setLoading(true);
    try {
      const from = range?.[0]?.toISOString();
      const to = range?.[1]?.toISOString();
      const res = await LoansAPI.list({
        page: opts.page ?? page,
        limit: opts.limit ?? limit,
        status,
        from,
        to,
        q,
      });
      setRows(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setLimit(res.limit || 10);
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
      /* ignore */
    }
  };

  useEffect(() => {
    load({ page: 1 });
    loadApproved();
  }, []);

  useEffect(() => {
    load({ page: 1 });
  }, [status, q, range]);

  const statusTag = (s) => {
    const map = { ACTIVE: "processing", RETURNED: "success", OVERDUE: "error" };
    return <Tag color={map[s] || "default"}>{s}</Tag>;
  };

  const columns = useMemo(() => {
    if (isMobile) {
      return [
        { title: "ID", dataIndex: "id", width: 60, fixed: "left" },
        { title: "Item", dataIndex: "itemId", width: 80 },
        { title: "User", dataIndex: "userId", width: 80 },
        {
          title: "When",
          key: "when",
          ellipsis: true,
          render: (_, r) => (
            <span>
              {new Date(r.checkoutAt).toLocaleString()} →{" "}
              {new Date(r.dueAt).toLocaleString()}
              {r.returnedAt ? (
                <>
                  <br />
                  Returned: {new Date(r.returnedAt).toLocaleString()}
                </>
              ) : null}
            </span>
          ),
        },
        { title: "Status", dataIndex: "status", render: statusTag, width: 110 },
        {
          title: "Actions",
          width: 120,
          render: (_, r) => (
            <Button
              size="small"
              disabled={r.status !== "ACTIVE"}
              onClick={() => returnLoan(r.id)}
            >
              Return
            </Button>
          ),
        },
      ];
    }

    return [
      { title: "ID", dataIndex: "id", width: 70, fixed: "left" },
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
    ];
  }, [isMobile]);

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

  const onReservationChange = (id) => {
    form.setFieldsValue({ reservation_id: id });
    setSelectedRes(approvedReservations.find((r) => r.id === id) || null);
  };

  const validateDue = (_, v) => {
    if (!v) return Promise.reject(new Error("Pick due date"));
    const now = dayjs();
    if (!v.isAfter(now, "minute"))
      return Promise.reject(new Error("Due must be in the future"));
    if (selectedRes) {
      const resEnd = dayjs(selectedRes.endDate);
      if (!v.isAfter(resEnd, "minute"))
        return Promise.reject(
          new Error("Due must be after the reservation end")
        );
    }
    return Promise.resolve();
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
      setSelectedRes(null);
      load();
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
        <div className="mb-3">
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12} md="auto">
              <Select
                allowClear
                placeholder="Status"
                value={status}
                onChange={setStatus}
                options={["ACTIVE", "RETURNED", "OVERDUE"].map((s) => ({
                  value: s,
                  label: s,
                }))}
                style={{ width: isMobile ? "100%" : 160 }}
              />
            </Col>
            <Col xs={24} sm={12} md="auto">
              <RangePicker
                value={range}
                onChange={setRange}
                showTime
                placeholder={["From", "To"]}
                style={{ width: isMobile ? "100%" : 280 }}
              />
            </Col>
            <Col xs={24} sm={16} md="auto">
              <Input.Search
                placeholder="Search user/item"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onSearch={() => load({ page: 1 })}
                allowClear
                style={{ width: isMobile ? "100%" : 240 }}
              />
            </Col>
            <Col xs={24} sm={8} md="auto">
              <Button
                style={{ width: isMobile ? "100%" : "auto" }}
                onClick={() => {
                  setStatus(undefined);
                  setQ("");
                  setRange(null);
                }}
              >
                Reset
              </Button>
            </Col>
          </Row>
        </div>

        <Table
          rowKey="id"
          dataSource={rows}
          columns={columns}
          loading={loading}
          size={isMobile ? "small" : "middle"}
          sticky
          scroll={{ x: isMobile ? 720 : undefined }}
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: !isMobile,
            responsive: true,
          }}
          onChange={(p) => {
            const next = p.current;
            const size = p.pageSize;
            setPage(next);
            setLimit(size);
            load({ page: next, limit: size });
          }}
        />

        <Modal
          open={open}
          title="Checkout Item"
          onCancel={() => {
            setOpen(false);
            form.resetFields();
            setSelectedRes(null);
          }}
          onOk={submit}
          okText="Create Loan"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="reservation_id"
              label="Approved Reservation"
              rules={[{ required: true, message: "Select a reservation" }]}
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
                onChange={onReservationChange}
              />
            </Form.Item>

            <Form.Item
              name="due_at"
              label="Due date & time"
              rules={[{ validator: validateDue }]}
            >
              <DatePicker showTime className="w-full" />
            </Form.Item>

            {selectedRes && (
              <div className="text-sm text-gray-600">
                Reservation window:{" "}
                {new Date(selectedRes.startDate).toLocaleString()} →{" "}
                {new Date(selectedRes.endDate).toLocaleString()}
              </div>
            )}
          </Form>
        </Modal>
      </Card>
    </Layout>
  );
}
