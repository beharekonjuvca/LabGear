import { Card } from "antd";

export default function KPI({ title, value }) {
  return (
    <Card>
      <h3 className="text-gray-500">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </Card>
  );
}
