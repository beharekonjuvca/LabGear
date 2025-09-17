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
import isBetween from "dayjs/plugin/isBetween";
dayjs.extend(isBetween);

import ReservationsAPI from "../api/reservations";
import ItemsAPI from "../api/items";
import Layout from "../components/Layout";
import { isStaffOrAdmin } from "../utils/auth";

const { RangePicker } = DatePicker;
const { useBreakpoint } = Grid;

export default function Reservations() {
  const screens = useBreakpoint();
  const isMobile = !screens.md; // < md = mobile/tablet portrait

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [status, setStatus] = useState();
  const [q, setQ] = useState("");
  const [listRange, setListRange] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const [blocks, setBlocks] = useState([]);

  const load = async (opts = {}) => {
    setLoading(true);
    try {
      const from = listRange?.[0]?.toISOString();
      const to = listRange?.[1]?.toISOString();
      const res = await ReservationsAPI.list({
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
      /* ignore */
    }
  };

  useEffect(() => {
    load({ page: 1 });
    loadItems();
  }, []);

  useEffect(() => {
    load({ page: 1 });
  }, [status, q, listRange]);

  const statusTag = (s) => {
    const map = {
      PENDING: "default",
      APPROVED: "processing",
      CANCELLED: "error",
      CONVERTED: "success",
    };
    return <Tag color={map[s] || "default"}>{s}</Tag>;
  };

  // Columns adapt to screen size
  const columns = useMemo(() => {
    if (isMobile) {
      return [
        { title: "ID", dataIndex: "id", width: 70, fixed: "left" },
        { title: "Item", dataIndex: "itemId", width: 80 },
        { title: "User", dataIndex: "userId", width: 80 },
        {
          title: "When",
          key: "when",
          render: (_, r) => (
            <span>
              {new Date(r.startDate).toLocaleString()} →{" "}
              {new Date(r.endDate).toLocaleString()}
            </span>
          ),
          ellipsis: true,
        },
        { title: "Status", dataIndex: "status", render: statusTag, width: 110 },
      ];
    }
    // desktop / md+
    return [
      { title: "ID", dataIndex: "id", width: 70, fixed: "left" },
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
        render: (_, r) =>
          isStaffOrAdmin() ? (
            <Space wrap>
              <Button
                size="small"
                disabled={!(r.status === "PENDING")}
                onClick={() => approve(r.id)}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                disabled={!(r.status === "PENDING" || r.status === "APPROVED")}
                onClick={() => cancel(r.id)}
              >
                Cancel
              </Button>
            </Space>
          ) : null,
      },
    ];
  }, [isMobile]);

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

  const onItemChange = async (itemId) => {
    form.setFieldsValue({ item_id: itemId });
    setBlocks([]);
    if (!itemId) return;
    try {
      const from = dayjs().startOf("day").toISOString();
      const to = dayjs().add(90, "day").endOf("day").toISOString();
      const res = await ItemsAPI.availability(itemId, from, to);
      const mapped = (res.blocks || []).map((b) => ({
        start: dayjs(b.start),
        end: dayjs(b.end),
        type: b.type,
      }));
      setBlocks(mapped);
    } catch {
      setBlocks([]);
    }
  };

  const disabledDate = (d) => {
    if (!d) return false;
    if (d.isBefore(dayjs().startOf("day"))) return true;
    return blocks.some((b) => d.isBetween(b.start, b.end, "day", "[]"));
  };

  const validateRange = (_, range) => {
    if (!range || range.length !== 2)
      return Promise.reject(new Error("Pick start and end date"));
    const [s, e] = range;
    if (!s || !e) return Promise.reject(new Error("Pick start and end date"));
    if (!e.isAfter(s, "minute"))
      return Promise.reject(new Error("End must be after start"));
    const conflict = blocks.some(
      (b) => !(e.isBefore(b.start, "minute") || s.isAfter(b.end, "minute"))
    );
    return conflict
      ? Promise.reject(
          new Error("Selected range overlaps with existing reservation/loan")
        )
      : Promise.resolve();
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
      setBlocks([]);
      load();
    } catch (e) {
      if (e?.response?.status === 409) {
        message.error("That time range is no longer available");
      } else if (e?.response?.status === 401) {
        message.error("Please login again");
      } else if (e?.errorFields) {
        // handled by antd
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
        {/* Filters row: stack on small screens */}
        <div className="mb-3">
          <Row gutter={[8, 8]}>
            <Col xs={24} sm={12} md="auto">
              <Select
                allowClear
                placeholder="Status"
                value={status}
                onChange={setStatus}
                options={["PENDING", "APPROVED", "CANCELLED", "CONVERTED"].map(
                  (s) => ({ value: s, label: s })
                )}
                style={{ width: isMobile ? "100%" : 160 }}
              />
            </Col>
            <Col xs={24} sm={12} md="auto">
              <RangePicker
                value={listRange}
                onChange={setListRange}
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
                  setListRange(null);
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
          scroll={{ x: isMobile ? 720 : undefined }} // horizontal scroll fallback on small screens
          pagination={{
            current: page,
            pageSize: limit,
            total,
            showSizeChanger: !isMobile, // simpler pagination on phones
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
          title="New Reservation"
          onCancel={() => {
            setOpen(false);
            form.resetFields();
            setBlocks([]);
          }}
          onOk={submit}
          okText="Create"
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="item_id"
              label="Item"
              rules={[{ required: true, message: "Select an item" }]}
            >
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
                onChange={onItemChange}
              />
            </Form.Item>

            <Form.Item
              name="range"
              label="Date & time range"
              rules={[{ validator: validateRange }]}
            >
              <RangePicker
                showTime
                disabledDate={disabledDate}
                className="w-full"
                placeholder={["Start", "End"]}
              />
            </Form.Item>

            {blocks.length > 0 && (
              <Card size="small" className="mt-2" title="Unavailable periods">
                <ul className="list-disc ml-5">
                  {blocks.map((b, i) => (
                    <li key={i}>
                      {b.start.format("YYYY-MM-DD HH:mm")} →{" "}
                      {b.end.format("YYYY-MM-DD HH:mm")} ({b.type})
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </Form>
        </Modal>
      </Card>
    </Layout>
  );
}
