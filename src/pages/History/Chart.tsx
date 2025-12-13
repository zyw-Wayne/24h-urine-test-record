// AIGC START
import { Card, Space } from 'antd-mobile'
import { Line, Bar } from 'react-chartjs-2'
import EmptyState from '@/components/Common/EmptyState'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import type { TestCycle } from '@/types'
import { formatDate } from '@/utils'

// 注册Chart.js组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface HistoryChartProps {
  cycles: TestCycle[]
}

const HistoryChart = ({ cycles }: HistoryChartProps) => {
  // 准备数据
  const sortedCycles = [...cycles].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  const labels = sortedCycles.map((cycle) => formatDate(cycle.startTime))
  const volumes = sortedCycles.map((cycle) => cycle.totalVolume)
  const proteins = sortedCycles
    .map((cycle) => (cycle.testResults?.proteinTotal24h || 0) * 1000)
    .map((v) => (v === 0 ? null : v))
  const creatinines = sortedCycles
    .map((cycle) => cycle.testResults?.creatinine || null)
    .map((v) => (v === 0 ? null : v))

  // 尿量趋势图
  const volumeChartData = {
    labels,
    datasets: [
      {
        label: '总尿量 (ml)',
        data: volumes,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  }

  // 尿蛋白趋势图
  const proteinChartData = {
    labels,
    datasets: [
      {
        label: '24h总蛋白 (mg)',
        data: proteins,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
      },
    ],
  }

  // 肌酐趋势图
  const creatinineChartData = {
    labels,
    datasets: [
      {
        label: '肌酐 (μmol/L)',
        data: creatinines,
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
      },
    ],
  }

  // 多指标对比图（柱状图）
  const comparisonChartData = {
    labels,
    datasets: [
      {
        label: '总尿量 (ml)',
        data: volumes,
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: '24h总蛋白 (mg)',
        data: proteins,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  }

  if (cycles.length === 0) {
    return <EmptyState description="暂无数据可显示" />
  }

  return (
    <div>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
        <h3>数据图表</h3>
      </div>

      <Space direction="vertical" style={{ width: '100%' }}>
        {/* 尿量趋势图 */}
        <Card title="尿量趋势">
          <div style={{ height: '250px' }}>
            <Line data={volumeChartData} options={chartOptions} />
          </div>
        </Card>

        {/* 尿蛋白趋势图 */}
        {proteins.some((v) => v !== null) && (
          <Card title="24h总蛋白趋势">
            <div style={{ height: '250px' }}>
              <Line data={proteinChartData} options={chartOptions} />
            </div>
          </Card>
        )}

        {/* 肌酐趋势图 */}
        {creatinines.some((v) => v !== null) && (
          <Card title="肌酐趋势">
            <div style={{ height: '250px' }}>
              <Line data={creatinineChartData} options={chartOptions} />
            </div>
          </Card>
        )}

        {/* 多指标对比图 */}
        <Card title="多指标对比">
          <div style={{ height: '250px' }}>
            <Bar data={comparisonChartData} options={chartOptions} />
          </div>
        </Card>
      </Space>
    </div>
  )
}

export default HistoryChart
// AIGC END

