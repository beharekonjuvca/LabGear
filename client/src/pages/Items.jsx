import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout.jsx";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Switch,
  Upload,
  Space,
  message,
  Popconfirm,
  Card,
  Grid,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";
import ItemsAPI from "../api/items";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "http://localhost:4000";
const { useBreakpoint } = Grid;

export default function Items() {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const [fileList, setFileList] = useState([]);

  const load = async (opts = {}) => {
    setLoading(true);
    try {
      const res = await ItemsAPI.list({
        page: opts.page ?? page,
        limit: opts.limit ?? limit,
        search,
      });
      setData(res.data || []);
      setTotal(res.total || 0);
      setPage(res.page || 1);
      setLimit(res.limit || 10);
    } catch {
      message.error("Failed to load items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ page: 1 });
  }, [search]);

  useEffect(() => {
    load();
  }, []);

  const columns = useMemo(() => {
    if (isMobile) {
      // Compact columns on small screens
      return [
        { title: "ID", dataIndex: "id", width: 60, fixed: "left" },
        {
          title: "Img",
          dataIndex: "imageUrl",
          width: 76,
          render: (v) =>
            v ? (
              <img
                src={`${API_ORIGIN}${v}`}
                alt="item"
                style={{
                  width: 56,
                  height: 42,
                  objectFit: "cover",
                  borderRadius: 6,
                }}
              />
            ) : (
              "-"
            ),
        },
        { title: "Name", dataIndex: "name", ellipsis: true },
        { title: "Code", dataIndex: "code", width: 120, ellipsis: true },
        {
          title: "Avail",
          dataIndex: "available",
          width: 80,
          render: (v) => (v ? "Yes" : "No"),
        },
        {
          title: "Actions",
          width: 160,
          render: (_, r) => (
            <Space wrap size="small">
              <Button size="small" onClick={() => openEdit(r)}>
                Edit
              </Button>
              <Popconfirm
                title="Delete this item?"
                onConfirm={() => doDelete(r.id)}
              >
                <Button size="small" danger>
                  Delete
                </Button>
              </Popconfirm>
            </Space>
          ),
        },
      ];
    }

    return [
      { title: "ID", dataIndex: "id", width: 70, fixed: "left" },
      {
        title: "Image",
        dataIndex: "imageUrl",
        width: 120,
        render: (v) =>
          v ? (
            <img
              src={`${API_ORIGIN}${v}`}
              alt="item"
              style={{
                width: 80,
                height: 60,
                objectFit: "cover",
                borderRadius: 6,
              }}
            />
          ) : (
            "-"
          ),
      },
      { title: "Name", dataIndex: "name" },
      { title: "Code", dataIndex: "code" },
      { title: "Category", dataIndex: "category" },
      {
        title: "Available",
        dataIndex: "available",
        width: 110,
        render: (v) => (v ? "Yes" : "No"),
      },
      {
        title: "Actions",
        width: 210,
        render: (_, r) => (
          <Space>
            <Button onClick={() => openEdit(r)}>Edit</Button>
            <Popconfirm
              title="Delete this item?"
              onConfirm={() => doDelete(r.id)}
            >
              <Button danger>Delete</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }, [isMobile]);

  const openAdd = () => {
    setEditing(null);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({ available: true });
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setFileList([]);
    form.resetFields();
    form.setFieldsValue({
      name: item.name,
      code: item.code,
      category: item.category,
      condition_note: item.conditionNote || "",
      available: item.available,
      image_url: item.imageUrl ? `${API_ORIGIN}${item.imageUrl}` : "",
    });
    setOpen(true);
  };

  const doDelete = async (id) => {
    try {
      await ItemsAPI.remove(id);
      message.success("Deleted");
      load();
    } catch {
      message.error("Delete failed");
    }
  };

  const beforeUpload = (file) => {
    setFileList([file]);
    return false;
  };

  const clearFile = () => setFileList([]);

  const submit = async () => {
    try {
      const vals = await form.validateFields();
      const payload = {
        name: vals.name,
        code: vals.code,
        category: vals.category,
        condition_note: vals.condition_note || "",
        available: !!vals.available,
        imageFile: fileList[0] || undefined,
        image_url: vals.image_url
          ? vals.image_url.startsWith(API_ORIGIN)
            ? vals.image_url.replace(API_ORIGIN, "")
            : vals.image_url
          : "",
      };

      if (editing) {
        await ItemsAPI.update(editing.id, payload);
        message.success("Updated");
      } else {
        await ItemsAPI.create(payload);
        message.success("Created");
      }

      setOpen(false);
      clearFile();
      load();
    } catch (e) {
      if (e?.response?.status === 409) {
        message.error("Code must be unique");
      } else if (e?.errorFields) {
        // form validation error
      } else {
        message.error("Save failed");
      }
    }
  };

  return (
    <Layout>
      <Card
        title="Items"
        extra={
          <Space wrap>
            <Input.Search
              placeholder="Search name/code/category"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onSearch={() => load({ page: 1 })}
              allowClear
              style={{ width: isMobile ? 180 : 260 }}
            />
            <Button type="primary" onClick={openAdd}>
              Add Item
            </Button>
          </Space>
        }
      >
        <Table
          rowKey="id"
          dataSource={data}
          columns={columns}
          loading={loading}
          size={isMobile ? "small" : "middle"}
          sticky
          scroll={{ x: isMobile ? 720 : undefined }} // horizontal scroll on phones
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
      </Card>

      <Modal
        open={open}
        onCancel={() => {
          setOpen(false);
          clearFile();
        }}
        onOk={submit}
        title={editing ? "Edit Item" : "Add Item"}
        okText={editing ? "Save" : "Create"}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, min: 2 }]}
          >
            <Input placeholder="Name" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Code"
            rules={[{ required: true, min: 2 }]}
          >
            <Input placeholder="Code" />
          </Form.Item>
          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, min: 2 }]}
          >
            <Input placeholder="Category" />
          </Form.Item>
          <Form.Item name="condition_note" label="Condition (optional)">
            <Input placeholder="e.g. Good, includes charger" />
          </Form.Item>
          <Form.Item
            name="available"
            label="Available"
            valuePropName="checked"
            tooltip="Is this item currently available to reserve?"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            label="Image (upload OR URL)"
            tooltip="Upload a file (preferred) or paste a full URL"
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              <Upload
                beforeUpload={beforeUpload}
                fileList={fileList}
                onRemove={() => setFileList([])}
                maxCount={1}
                accept="image/*"
                listType="picture"
              >
                <Button icon={<UploadOutlined />}>Choose Image</Button>
              </Upload>

              <Form.Item
                name="image_url"
                // relaxed validator: allow empty, http(s), or /uploads/...
                rules={[
                  () => ({
                    validator(_, v) {
                      if (!v) return Promise.resolve();
                      const own =
                        typeof v === "string" && v.startsWith("/uploads/");
                      const http =
                        typeof v === "string" && /^https?:\/\//i.test(v);
                      return own || http
                        ? Promise.resolve()
                        : Promise.reject(
                            new Error(
                              "Enter a valid URL (http(s) or /uploads/…)"
                            )
                          );
                    },
                  }),
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="https://… or /uploads/items/…"
                  disabled={fileList.length > 0}
                />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
}
