import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Layout from "../components/Layout.jsx";
import KPI from "../components/KPI.jsx";
import { Row, Col, Skeleton, Alert } from "antd";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("/dashboard/summary");
        setData(r.data);
      } catch (e) {
        setErr("Failed to load dashboard");
      }
    })();
  }, []);

  return (
    <Layout>
      {!data && !err && (
        <Row gutter={[16, 16]}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Col key={i} xs={24} sm={12} md={12} lg={6}>
              <Skeleton active paragraph={false} />
            </Col>
          ))}
        </Row>
      )}

      {err && <Alert type="error" message={err} showIcon className="mb-3" />}

      {data && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={6}>
            <KPI title="Total Items" value={data.total_items} />
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <KPI title="Active Loans" value={data.active_loans} />
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <KPI title="Overdue" value={data.overdue} />
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <KPI title="Utilization" value={`${data.utilization}%`} />
          </Col>
        </Row>
      )}
    </Layout>
  );
}
