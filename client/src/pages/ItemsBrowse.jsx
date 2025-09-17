import { useEffect, useMemo, useState } from "react";
import {
  Card,
  Input,
  Select,
  Switch,
  Row,
  Col,
  Button,
  Drawer,
  Space,
  Form,
  DatePicker,
  Tag,
  message,
  Grid,
} from "antd";
import ItemsAPI from "../api/items";
import ReservationsAPI from "../api/reservations";
import dayjs from "dayjs";
import Layout from "../components/Layout";
import isBetween from "dayjs/plugin/isBetween";
const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";
const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
    <rect width="100%" height="100%" fill="#f3f4f6"/>
    <g fill="#9ca3af" text-anchor="middle" font-family="sans-serif">
      <rect x="220" y="110" width="200" height="140" rx="8" fill="#e5e7eb"/>
      <text x="320" y="310" font-size="18">No image</text>
    </g>
  </svg>`);

dayjs.extend(isBetween);

const { RangePicker } = DatePicker;

export default function ItemsBrowse() {
  const [items, setItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [open, setOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [form] = Form.useForm();

  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const load = async () => {
    setLoading(true);
    try {
      const res = await ItemsAPI.list({
        page: 1,
        limit: 100,
        search,
        category,
        available: onlyAvailable ? true : undefined,
      });
      setItems(res.data);
      setAllItems(res.data);
    } catch {
      message.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set(allItems.map((i) => i.category));
    return Array.from(set);
  }, [allItems]);

  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    load();
  }, [search, category, onlyAvailable]);

  const openDrawer = async (item) => {
    setActiveItem(item);
    setOpen(true);
    form.resetFields();
    try {
      const from = dayjs().startOf("day").toISOString();
      const to = dayjs().add(90, "day").endOf("day").toISOString();
      const { blocks } = await ItemsAPI.availability(item.id, from, to);
      setBlocks(
        blocks.map((b) => ({
          start: dayjs(b.start),
          end: dayjs(b.end),
          type: b.type,
        }))
      );
    } catch {
      setBlocks([]);
    }
  };

  const isDayBlocked = (d) => {
    return blocks.some((b) => d.isBetween(b.start, b.end, "day", "[]"));
  };

  const disabledDate = (d) => {
    if (!d) return false;
    if (d.isBefore(dayjs().startOf("day"))) return true;
    return isDayBlocked(d);
  };

  const validateRangeNoOverlap = (_, range) => {
    if (!range || range.length !== 2)
      return Promise.reject(new Error("Pick a date range"));
    const [s, e] = range;
    const conflict = blocks.some(
      (b) => !(e.isBefore(b.start, "minute") || s.isAfter(b.end, "minute"))
    );
    return conflict
      ? Promise.reject(
          new Error("Selected range overlaps with existing reservation/loan")
        )
      : Promise.resolve();
  };

  const reserve = async () => {
    try {
      const vals = await form.validateFields();
      const [s, e] = vals.range;
      await ReservationsAPI.create({
        item_id: activeItem.id,
        start_date: s.toDate().toISOString(),
        end_date: e.toDate().toISOString(),
      });
      message.success("Reservation created (pending)");
      setOpen(false);
    } catch (e) {
      if (e?.response?.status === 409)
        message.error("That range is no longer available.");
      else if (e?.errorFields) {
        /* handled by antd */
      } else message.error("Failed to create reservation");
    }
  };

  return (
    <Layout>
      <Card className="mb-4">
        <Row gutter={12} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search name, code, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={6}>
            <Select
              allowClear
              placeholder="Category"
              value={category || undefined}
              onChange={(v) => setCategory(v || "")}
              options={categories.map((c) => ({ value: c, label: c }))}
              className="w-full"
            />
          </Col>
          <Col xs={24} sm={4} md={4}>
            <Space>
              <span>Only available</span>
              <Switch checked={onlyAvailable} onChange={setOnlyAvailable} />
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
            <Card
              title={item.name || "—"}
              extra={
                <Tag color={item.available ? "green" : "red"}>
                  {item.available ? "Available" : "Out"}
                </Tag>
              }
              cover={
                <img
                  src={
                    item.imageUrl
                      ? `${API_ORIGIN}${item.imageUrl}`
                      : PLACEHOLDER_IMG
                  }
                  alt={item.name || "item"}
                  style={{ height: 160, objectFit: "cover" }}
                  loading="lazy"
                />
              }
              actions={[
                <Button type="link" onClick={() => openDrawer(item)}>
                  View / Reserve
                </Button>,
              ]}
              bodyStyle={{ minHeight: 120 }}
            >
              <div className="text-sm text-gray-500">
                <strong>Code:</strong>{" "}
                <span className="line-clamp-1">{item.code || "—"}</span>
              </div>
              <div className="text-sm text-gray-500">
                <strong>Category:</strong>{" "}
                <span className="line-clamp-1">{item.category || "—"}</span>
              </div>
              <div
                className="text-sm mt-1 text-gray-700"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                <strong>Condition:</strong> {item.conditionNote || "—"}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Drawer
        width={480}
        title={activeItem ? `${activeItem.name} (${activeItem.code})` : "Item"}
        open={open}
        onClose={() => setOpen(false)}
        extra={
          activeItem && (
            <Tag color={activeItem.available ? "green" : "red"}>
              {activeItem.available ? "Available" : "Out"}
            </Tag>
          )
        }
      >
        {activeItem && (
          <>
            <div className="mb-3 text-gray-600">
              Category: {activeItem.category}
            </div>
            {activeItem.conditionNote && (
              <div className="mb-3">Condition: {activeItem.conditionNote}</div>
            )}
            {activeItem?.imageUrl && (
              <div className="mb-4">
                <img
                  src={`${API_ORIGIN}${activeItem.imageUrl}`}
                  alt={activeItem.name}
                  style={{
                    width: "100%",
                    maxHeight: 240,
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
              </div>
            )}
            <Card
              size="small"
              className="mb-4"
              title="Unavailable periods (next 90 days)"
            >
              <ul className="list-disc ml-5">
                {blocks.length === 0 && <li>No conflicts</li>}
                {blocks.map((b, i) => (
                  <li key={i}>
                    {b.start.format("YYYY-MM-DD HH:mm")} →{" "}
                    {b.end.format("YYYY-MM-DD HH:mm")} ({b.type})
                  </li>
                ))}
              </ul>
            </Card>

            <Card size="small" title="Reserve this item">
              <Form form={form} layout="vertical">
                <Form.Item
                  name="range"
                  label="Date & time range"
                  rules={[{ validator: validateRangeNoOverlap }]}
                >
                  <RangePicker
                    showTime
                    className="w-full"
                    placeholder={["Start", "End"]}
                    disabledDate={disabledDate /* where applicable */}
                    dropdownClassName={isMobile ? "rp-mobile" : undefined}
                    placement="bottomLeft"
                    inputReadOnly={isMobile}
                  />
                </Form.Item>
                <Space>
                  <Button type="primary" onClick={reserve}>
                    Reserve
                  </Button>
                  <Button onClick={() => setOpen(false)}>Cancel</Button>
                </Space>
              </Form>
            </Card>
          </>
        )}
      </Drawer>
    </Layout>
  );
}
