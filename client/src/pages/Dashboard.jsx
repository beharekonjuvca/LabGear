import { useEffect, useState } from "react";
import api from "../api/axios.js";
import Layout from "../components/Layout.jsx";
import KPI from "../components/KPI.jsx";
import { Row, Col } from "antd";

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((r) => setData(r.data));
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <Layout>
      <Row gutter={16}>
        <Col span={6}>
          <KPI title="Total Items" value={data.total_items} />
        </Col>
        <Col span={6}>
          <KPI title="Active Loans" value={data.active_loans} />
        </Col>
        <Col span={6}>
          <KPI title="Overdue" value={data.overdue} />
        </Col>
        <Col span={6}>
          <KPI title="Utilization" value={data.utilization + "%"} />
        </Col>
      </Row>
    </Layout>
  );
}
