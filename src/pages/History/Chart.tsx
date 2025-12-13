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
  const protein24hQuantitative = sortedCycles
    .map((cycle) => cycle.testResults?.protein24hQuantitative || null)
    .map((v) => (v === 0 ? null : v))
  const creatinines = sortedCycles
    .map((cycle) => cycle.testResults?.creatinine || null)
    .map((v) => (v === 0 ? null : v))
  
  // 将尿常规值转换为数值用于图表显示
  const convertRoutineValue = (value: string | undefined): number | null => {
    if (!value) return null
    // 处理各种可能的格式
    const normalizedValue = String(value).trim()
    if (normalizedValue === '阴性(-)' || normalizedValue === '阴性' || normalizedValue === '-') return 0
    if (normalizedValue === '弱阳性(±)' || normalizedValue === '弱阳性' || normalizedValue === '±') return 0.5
    if (normalizedValue === '1+' || normalizedValue === '++') return 1
    if (normalizedValue === '2+' || normalizedValue === '+++') return 2
    if (normalizedValue === '3+' || normalizedValue === '++++') return 3
    if (normalizedValue === '4+') return 4
    return null
  }
  
  const proteinRoutineValues = sortedCycles
    .map((cycle) => convertRoutineValue(cycle.testResults?.proteinRoutine))
  const occultBloodValues = sortedCycles
    .map((cycle) => convertRoutineValue(cycle.testResults?.occultBlood))

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

  // 24h总蛋白趋势图
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

  // 24H尿蛋白定量趋势图
  const protein24hQuantitativeChartData = {
    labels,
    datasets: [
      {
        label: '24H尿蛋白定量 (mg/L)',
        data: protein24hQuantitative,
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.1,
      },
    ],
  }

  // 尿常规-尿蛋白趋势图（柱状图更适合分类数据）
  const proteinRoutineChartData = {
    labels,
    datasets: [
      {
        label: '尿常规-尿蛋白',
        data: proteinRoutineValues,
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.6)',
      },
    ],
  }

  // 尿常规-潜血趋势图（柱状图更适合分类数据）
  const occultBloodChartData = {
    labels,
    datasets: [
      {
        label: '尿常规-潜血',
        data: occultBloodValues,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  }
  
  // 获取原始分类值用于 Tooltip
  const getRoutineLabel = (value: number | null): string => {
    const labels: { [key: number]: string } = {
      0: '阴性(-)',
      0.5: '弱阳性(±)',
      1: '1+/++',
      2: '2+/+++',
      3: '3+/++++',
      4: '4+',
    }
    return value !== null ? labels[value] || '' : '无数据'
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

  // 多指标对比图（柱状图）- 数值型指标
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
      {
        label: '24H尿蛋白定量 (mg/L)',
        data: protein24hQuantitative,
        backgroundColor: 'rgba(255, 159, 64, 0.5)',
      },
      {
        label: '肌酐 (μmol/L)',
        data: creatinines,
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
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

  // 尿常规图表的 Tooltip 配置（需要在 chartOptions 定义之后）
  const routineChartOptions = {
    ...chartOptions,
    plugins: {
      ...chartOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y
            return `${context.dataset.label}: ${getRoutineLabel(value)}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 0.5,
          callback: function(value: any) {
            const labels: { [key: number]: string } = {
              0: '阴性(-)',
              0.5: '弱阳性(±)',
              1: '1+/++',
              2: '2+/+++',
              3: '3+/++++',
              4: '4+',
            }
            return labels[value] || value
          }
        }
      }
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
        {/* 24H尿蛋白定量趋势图 */}
        {protein24hQuantitative.some((v) => v !== null) && (
          <Card title="24H尿蛋白定量趋势">
            <div style={{ height: '250px' }}>
              <Line data={protein24hQuantitativeChartData} options={chartOptions} />
            </div>
          </Card>
        )}

        {/* 尿常规-尿蛋白趋势图 */}
        <Card title="尿常规-尿蛋白趋势">
          <div style={{ height: '250px' }}>
            {proteinRoutineValues.some((v) => v !== null) ? (
              <Bar 
                data={proteinRoutineChartData} 
                options={routineChartOptions} 
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#999',
                fontSize: '14px'
              }}>
                暂无数据，请先录入检测结果中的"尿常规-尿蛋白"字段
              </div>
            )}
          </div>
        </Card>

        {/* 肌酐趋势图 */}
        {creatinines.some((v) => v !== null) && (
          <Card title="肌酐趋势">
            <div style={{ height: '250px' }}>
              <Line data={creatinineChartData} options={chartOptions} />
            </div>
          </Card>
        )}

        {/* 尿常规-潜血趋势图 */}
        <Card title="尿常规-潜血趋势">
          <div style={{ height: '250px' }}>
            {occultBloodValues.some((v) => v !== null) ? (
              <Bar 
                data={occultBloodChartData} 
                options={routineChartOptions} 
              />
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                color: '#999',
                fontSize: '14px'
              }}>
                暂无数据，请先录入检测结果中的"尿常规-潜血"字段
              </div>
            )}
          </div>
        </Card>

        {/* 多指标对比图 */}
        <Card title="多指标对比">
          <div style={{ height: '300px' }}>
            <Bar data={comparisonChartData} options={chartOptions} />
          </div>
        </Card>
      </Space>
    </div>
  )
}

export default HistoryChart

