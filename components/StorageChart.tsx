"use client";

import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StorageChartProps {
  data: {
    labels: string[];
    datasets: any[];
  };
}

export default function StorageChart({ data }: StorageChartProps) {
  return (
    <div className="h-[300px] w-full">
      <Line 
        options={{ 
          maintainAspectRatio: false,
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#1a1a1a',
              titleFont: { family: 'var(--font-outfit)', size: 14 },
              bodyFont: { family: 'var(--font-inter)', size: 12 },
              padding: 12,
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              displayColors: false,
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(255,255,255,0.03)',
                tickBorderDash: [5, 5],
              },
              ticks: {
                color: 'rgba(255,255,255,0.3)',
                font: { size: 10, family: 'var(--font-inter)' },
                padding: 10,
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: 'rgba(255,255,255,0.3)',
                font: { size: 10, family: 'var(--font-inter)' },
                padding: 10,
              }
            }
          }
        }} 
        data={data} 
      />
    </div>
  );
}
