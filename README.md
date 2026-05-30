# 24小时尿蛋白检测记录系统

一个纯前端的 H5 移动端应用，帮助肾病患者便捷地记录 24 小时尿液收集过程、录入检测指标、追踪历史数据趋势。**所有数据存储在本地浏览器，不上传服务器。**

## 功能

### 📝 检测记录
- **24小时周期管理**：一键开始/结束检测周期，实时倒计时 + 进度条
- **排尿记录**：每次排尿后记录时间和尿量，自动累加总尿量
- **检测指标录入**：24H尿蛋白定量、尿常规、肌酐、尿比重、pH值等
- **自动计算**：24 小时总尿蛋白量自动计算
- **异常值高亮**：根据性别自动匹配肌酐正常值范围，超标指标红色 + ⚠️ 提示

### 📊 历史追踪
- **历史记录**：按时间倒序，支持最近 3 个月 / 6 个月 / 全部筛选
- **数据可视化**：折线图 + 柱状图展示尿蛋白、肌酐、尿量等多指标趋势（Chart.js）
- **记录详情**：查看完整周期信息、检测结果、排尿记录明细
- **手动录入**：支持录入历史周期的检测数据

### 💾 数据管理
- **Excel 导出**：导出全部记录为 `.xlsx`，方便给医生查看
- **JSON 备份/恢复**：备份完整数据，支持跨设备迁移
- **数据清空**：二次确认，防止误操作

### ⚙️ 用户设置
- **个人信息**：昵称、性别、年龄（性别影响肌酐正常值判定）
- **单位设置**：尿量 ml/L、蛋白 mg/g
- **深色主题**：浅色 / 深色一键切换（antd-mobile 原生暗色方案）
- **使用说明**：内置检测流程、注意事项、正常值参考

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| UI | Ant Design Mobile 5 |
| 存储 | IndexedDB (Dexie.js) |
| 图表 | Chart.js + react-chartjs-2 |
| 构建 | Vite 5 |
| 路由 | React Router 6 |
| 代码规范 | ESLint + Prettier |

## 快速开始

```bash
# 环境要求: Node.js >= 16, npm >= 7

# 安装
npm install

# 开发
npm run dev        # → http://localhost:3000

# 构建
npm run build      # → dist/

# 预览
npm run preview

# 代码检查
npm run lint
npm run format
```

## 项目结构

```
src/
├── components/          # 公共组件
│   ├── Layout/         # 底部导航栏布局
│   └── Common/         # ErrorBoundary / Loading / EmptyState / TimerDisplay
├── pages/              # 页面
│   ├── Record/         # 检测记录页
│   ├── History/        # 历史记录 + 详情 + 图表
│   └── Profile/        # 用户设置 + 数据管理
├── services/           # 数据层
│   ├── db.ts           # IndexedDB CRUD（事务保护、批量查询）
│   ├── export.ts       # Excel 导出
│   └── backup.ts       # JSON 备份/恢复
├── utils/              # 工具函数
│   ├── index.ts        # 格式化、计算、ID 生成等
│   └── normalRanges.ts # 正常值范围 + 异常值判断
├── types/              # TypeScript 类型定义
└── constants/          # 常量（正常值、尿常规映射表等）
```

## 核心数据模型

| 模型 | 说明 | 关键字段 |
|------|------|---------|
| `TestCycle` | 检测周期 | id, startTime, endTime, status, totalVolume, testResults |
| `UrinationRecord` | 排尿记录 | id, cycleId, time, volume |
| `TestResult` | 检测结果 | protein24hQuantitative, creatinine, specificGravity, ph, proteinRoutine |
| `UserConfig` | 用户配置 | nickname, gender, age, unit (volume/protein), theme |

### 业务规则

- 同一时间只有一个进行中的周期
- 周期进行中可添加/删除排尿记录；结束后只读
- 周期结束后仍可录入/编辑检测结果
- 开始新周期前检查上一周期是否已录入结果，未录入时提示
- 异常值判断：肌酐分性别（男 53-106 / 女 44-97 μmol/L），其余男女通用
- 24h 总蛋白公式：`(蛋白浓度 mg/L × 总尿量 ml) / 1,000,000 = 总蛋白 g`

## 构建产物

生产构建使用 `React.lazy` 路由级代码分割 + Vite `manualChunks`，产物按需加载：

| Chunk | 大小 | 内容 |
|-------|------|------|
| `vendor` | ~160 KB | react, react-dom, react-router-dom |
| `chart` | ~169 KB | chart.js, react-chartjs-2 |
| `ui` | ~269 KB | antd-mobile |
| `excel` | ~282 KB | xlsx (仅导出时加载) |
| 页面 chunks | ~100 KB | 各页面按需加载 |

## 性能优化

- IndexedDB 批量查询（`anyOf`）替代逐条循环 N+1 查询
- 写入操作由 Dexie 事务保护，消除并发竞态
- 计时器独立为 `TimerDisplay` 子组件，避免全页每秒重渲染
- 关键计算使用 `useMemo` 缓存
- 历史数据按时间范围在数据库侧过滤，避免全量拉取客户端筛选

## 浏览器兼容

- iOS Safari 12+、Android Chrome 80+
- 微信内置浏览器
- 安全区域适配（iPhone X 等刘海屏）
- 防止双击缩放（`touch-action: manipulation`）
- 输入框 16px 防 iOS 自动缩放

## 注意事项

### 检测流程
1. 首次排尿 **不收集**，之后的所有尿液都需收集
2. 尿液需冷藏保存，避免细菌污染
3. 检测期间避免剧烈运动、高蛋白饮食
4. 建议定期备份数据

### 正常值参考

| 指标 | 正常范围 |
|------|---------|
| 24小时尿蛋白 | < 150 mg（男女通用） |
| 肌酐（男） | 53-106 μmol/L |
| 肌酐（女） | 44-97 μmol/L |
| 尿比重 | 1.003-1.030（男女通用） |
| pH值 | 4.6-8.0（男女通用） |

## 部署

### Vercel

项目已包含 `vercel.json`（SPA 路由重写 + 静态资源缓存策略），关联 Git 仓库后自动部署：

- 静态资源（`/assets/*`）：`immutable` 1 年缓存
- HTML（`/*`）：`no-cache`

### GitHub Pages

```bash
npm run build
# 将 dist/ 部署到 gh-pages 分支
```

## 路线图

- **v1.x**：核心功能完成，离线本地存储，基础数据可视化
- **v2.0**（规划）：智能提醒、PDF 报告、PWA 离线支持、云同步
- **v3.0**（规划）：AI 辅助分析、医生端功能、社区知识库

## 许可证

[MIT](./LICENSE)
