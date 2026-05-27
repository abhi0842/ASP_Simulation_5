/**
 * ScientificChart.jsx — reusable Chart.js line chart for the virtual lab
 */

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import styles from './scientificChart.module.css';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index', intersect: false },
  plugins: {
    legend: { display: true, position: 'top' },
    tooltip: { enabled: true },
  },
  scales: {
    x: {
      type: 'linear',
      title: { display: true, text: 'Time (s)' },
      ticks: { maxTicksLimit: 8 },
    },
    y: {
      title: { display: true, text: 'Amplitude' },
    },
  },
};

export function ScientificChart({
  title,
  datasets = [],
  xLabel = 'Time (s)',
  yLabel = 'Amplitude',
  height = 220,
  showLegend = true,
  annotation,
}) {
  const chartData = useMemo(
    () => ({
      datasets: datasets.map((ds) => ({
        pointRadius: 0,
        borderWidth: 1.5,
        tension: 0.15,
        fill: ds.fill ?? false,
        ...ds,
        data: ds.data?.map((y, i) =>
          typeof ds.time?.[i] === 'number'
            ? { x: ds.time[i], y }
            : { x: i, y }
        ) ?? ds.points ?? [],
      })),
    }),
    [datasets]
  );

  const options = useMemo(
    () => ({
      ...defaultOptions,
      plugins: {
        ...defaultOptions.plugins,
        legend: { ...defaultOptions.plugins.legend, display: showLegend },
        title: title ? { display: true, text: title, font: { size: 13 } } : { display: false },
      },
      scales: {
        x: { ...defaultOptions.scales.x, title: { display: true, text: xLabel } },
        y: { ...defaultOptions.scales.y, title: { display: true, text: yLabel } },
      },
    }),
    [title, xLabel, yLabel, showLegend]
  );

  return (
    <div className={styles.chartWrap} style={{ height }}>
      {annotation && <p className={styles.annotation}>{annotation}</p>}
      <Line data={chartData} options={options} />
    </div>
  );
}

export default ScientificChart;
