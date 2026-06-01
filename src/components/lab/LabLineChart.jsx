import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function LabLineChart({
  data,
  xKey = "t",
  lines = [],
  heightClass,
  title,
}) {
  return (
    <div className={heightClass} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {lines.map((ln) => (
            <Line
              key={ln.key}
              type="monotone"
              dataKey={ln.key}
              name={ln.name}
              stroke={ln.color}
              dot={false}
              strokeWidth={ln.width ?? 2}
              strokeDasharray={ln.dash}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      {title && (
        <p style={{ fontSize: 11, textAlign: "center", margin: "4px 0 0", color: "#555" }}>
          {title}
        </p>
      )}
    </div>
  );
}
