# 24小时尿蛋白检测记录 — Android App

一个帮助肾病患者便捷记录 24 小时尿液收集过程、录入检测指标、追踪历史数据趋势的 **Android 离线 App**。基于 React + Capacitor 构建，**所有数据存储在本地，不上传服务器**。

> 🌐 同时也是 PWA H5，可直接通过浏览器访问。但推荐使用 Android APK 版本以获得完整原生体验。

---

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 18 + TypeScript 5 |
| UI | Ant Design Mobile 5 |
| 存储 | IndexedDB (Dexie.js) |
| 图表 | Chart.js + react-chartjs-2 |
| 构建 | Vite 5 |
| 路由 | React Router 6 |
| 原生壳 | **Capacitor 6**（Android WebView） |
| 代码规范 | ESLint + Prettier |

---

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

---

## 快速开始（Web 开发）

```bash
# 环境要求: Node.js >= 18, npm >= 9

# 安装依赖
npm install

# 启动开发服务器 → http://localhost:3000
npm run dev

# 构建 web 版本 → dist/
npm run build

# 预览构建产物
npm run preview
```

---

## 编译 Android APK

### 前提条件

| 工具 | 说明 |
|------|------|
| **Android Studio** | 包含 Android SDK、编译工具链 |
| **JDK 17+** | Java 开发工具包 |
| **Node.js >= 18** | 前端构建环境 |

> macOS 用户可通过 Homebrew 安装：
> ```bash
> brew install --cask android-studio
> brew install openjdk@17
> ```

安装 Android Studio 后，在 **SDK Manager** 中安装：
- Android SDK Platform 36（或对应 compileSdkVersion）
- Android SDK Build-Tools 36+

### 编译 APK

```bash
# 1. 构建 web 资源并同步到 Android 工程
npm run cap:build

# 2. 编译 Android APK
cd android
./gradlew assembleDebug

# 3. APK 产出路径：
#    android/app/build/outputs/apk/debug/app-debug.apk
```

### 一条命令全流程

项目已配置组合脚本，构建 + 同步一步完成：

```bash
npm run cap:build
```

### 在 Android Studio 中开发调试

```bash
npm run cap:open:android
```

这会用 Android Studio 打开 Android 工程，你可以连接设备或启动模拟器直接 `Run`。

### 发布版 APK（Release）

```bash
cd android
./gradlew assembleRelease
```

需要配置签名密钥，参考 [Android 官方签名文档](https://developer.android.com/studio/publish/app-signing)。

---

## 项目结构

```
├── src/                     # React 前端源码
│   ├── components/          #   公共组件
│   │   ├── Layout/         #     底部导航栏布局
│   │   └── Common/         #     ErrorBoundary / Loading / EmptyState
│   ├── pages/              #   页面
│   │   ├── Record/         #     检测记录页
│   │   ├── History/        #     历史记录 + 详情 + 图表
│   │   └── Profile/        #     用户设置 + 数据管理
│   ├── services/           #   数据层
│   │   ├── db.ts           #     IndexedDB CRUD
│   │   ├── export.ts       #     Excel 导出
│   │   └── backup.ts       #     JSON 备份/恢复
│   ├── utils/              #   工具函数
│   ├── types/              #   TypeScript 类型
│   └── constants/          #   常量（正常值、尿常规映射表）
├── android/                 # Android 原生工程（Capacitor 生成）
├── capacitor.config.ts      # Capacitor 配置
├── vite.config.ts           # Vite 构建配置
└── vercel.json              # H5 部署配置
```

---

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
- 异常值判定：肌酐分性别（男 53-106 / 女 44-97 μmol/L），其余通用
- 24h 总蛋白公式：`(蛋白浓度 mg/L × 总尿量 ml) / 1,000,000 = 总蛋白 g`

---

## 构建产物分析

生产构建使用 `React.lazy` 路由级代码分割 + Vite `manualChunks`：

| Chunk | 大小 | 内容 |
|-------|------|------|
| `vendor` | ~160 KB | react, react-dom, react-router-dom |
| `chart` | ~169 KB | chart.js, react-chartjs-2 |
| `ui` | ~269 KB | antd-mobile |
| `excel` | ~282 KB | xlsx（仅导出时加载） |
| 页面 | ~100 KB | 各页面按需加载 |
| **APK 总大小** | **~4.3 MB** | debug APK（含 Android 壳） |

---

## 性能优化

- IndexedDB 批量查询（`anyOf`）替代逐条循环 N+1 查询
- 写入操作由 Dexie 事务保护，消除并发竞态
- 计时器独立为 `TimerDisplay` 子组件，避免全页每秒重渲染
- 关键计算使用 `useMemo` 缓存
- 历史数据按时间范围在数据库侧过滤，避免全量拉取客户端筛选

---

## 浏览器兼容（H5 部署时）

- iOS Safari 12+、Android Chrome 80+
- 微信内置浏览器
- 安全区域适配（iPhone X 等刘海屏）
- 防止双击缩放（`touch-action: manipulation`）
- 输入框 16px 防 iOS 自动缩放

---

## H5 部署（可选项）

即使有 Android APK，项目仍可部署为 PWA H5：

### Vercel

项目已包含 `vercel.json`（SPA 路由重写 + 静态资源缓存策略），关联 Git 仓库后自动部署。

### GitHub Pages

```bash
npm run build
# 将 dist/ 部署到 gh-pages 分支
```

---

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

### IndexedDB 数据限额

> Android WebView 对 IndexedDB 有约 50MB 配额限制。如果长期使用积攒了大量记录，请定期导出备份并清空旧数据。

---

## 路线图

- **v1.x** ✅ 核心功能完成，离线本地存储，基础数据可视化
- **v2.0** 🚧 Capacitor 原生打包为 Android APK
- **v3.0** 🗓️ 规划中：智能提醒、PDF 报告、云同步
- **v4.0** 🗓️ 规划中：AI 辅助分析、医生端功能

---

## 许可证

[MIT](./LICENSE)
