# 24小时尿蛋白检测系统 - 部署文档

本文档提供了多种平台的详细部署方案，包括 Vercel、GitHub Pages、微信公众号 H5、微信小程序等。

## 目录

- [部署方案概览](#部署方案概览)
- [方案一：Vercel 部署](#方案一vercel-部署推荐)
- [方案二：GitHub Pages 部署](#方案二github-pages-部署)
- [方案三：微信公众号 H5 部署](#方案三微信公众号-h5-部署)
- [方案四：微信小程序部署](#方案四微信小程序部署需要改造)
- [方案五：其他推荐平台](#方案五其他推荐平台)
- [部署前准备](#部署前准备)
- [常见问题](#常见问题)

---

## 部署方案概览

| 平台 | 难度 | 成本 | 国内访问速度 | 推荐度 | 适用场景 |
|------|------|------|------------|--------|---------|
| Vercel | ⭐ | 免费 | 中等 | ⭐⭐⭐⭐⭐ | 快速部署，个人项目 |
| GitHub Pages | ⭐⭐ | 免费 | 较慢 | ⭐⭐⭐⭐ | 开源项目展示 |
| Netlify | ⭐ | 免费 | 中等 | ⭐⭐⭐⭐⭐ | 类似 Vercel |
| Cloudflare Pages | ⭐ | 免费 | 快 | ⭐⭐⭐⭐ | 全球 CDN 加速 |
| 腾讯云静态托管 | ⭐⭐ | 付费 | 快 | ⭐⭐⭐⭐ | 国内访问，需备案 |
| 微信小程序 | ⭐⭐⭐⭐ | 免费 | 快 | ⭐⭐⭐ | 需要改造代码 |

---

## 方案一：Vercel 部署（推荐⭐⭐⭐⭐⭐）

### 优势

- ✅ 零配置，自动 CI/CD
- ✅ 全球 CDN 加速
- ✅ 免费 HTTPS 证书
- ✅ 支持自定义域名
- ✅ 自动预览部署（PR）
- ✅ 适合个人和小型项目

### 前置要求

- GitHub 账号
- 项目已推送到 GitHub 仓库

### 部署步骤

#### 方式 A：通过 Vercel 网站部署（推荐）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "New Project" 或 "Add New..." → "Project"
   - 选择你的 GitHub 仓库 `24h-urine-test-record`
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Vite（自动检测）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`（自动填充）
   - **Output Directory**: `dist`（自动填充）
   - **Install Command**: `npm install`（自动填充）

4. **环境变量**（本项目无需环境变量）
   - 如有需要，可在 "Environment Variables" 中添加

5. **部署**
   - 点击 "Deploy" 按钮
   - 等待构建完成（约 1-2 分钟）
   - 部署成功后会自动跳转到项目页面

6. **访问应用**
   - 默认地址：`https://24h-urine-test-record.vercel.app`
   - 或使用自定义域名（见下方配置）

#### 方式 B：通过 Vercel CLI 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **在项目目录部署**
   ```bash
   cd /Users/wei/Code/24h-urine-test-record
   vercel
   ```

4. **按提示操作**
   - 选择项目范围（个人或团队）
   - 确认项目设置
   - 等待部署完成

### 配置文件

在项目根目录创建 `vercel.json`：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

**说明**：
- `routes` 配置确保所有路由都指向 `index.html`，支持 React Router 的客户端路由
- `distDir` 指定构建输出目录

### 自定义域名配置

1. **在 Vercel 项目设置中添加域名**
   - 进入项目 → Settings → Domains
   - 点击 "Add Domain"
   - 输入你的域名（如：`urine-test.example.com`）

2. **配置 DNS 记录**
   - 在域名服务商（如阿里云、腾讯云）添加 CNAME 记录：
     - 类型：`CNAME`
     - 主机记录：`urine-test`（或 `@` 表示根域名）
     - 记录值：`cname.vercel-dns.com`（Vercel 会提供具体值）

3. **等待 DNS 生效**
   - 通常 1-24 小时生效
   - Vercel 会自动配置 HTTPS 证书

### 自动部署

- **自动触发**：每次推送到 GitHub 的 `main` 分支会自动部署
- **预览部署**：每个 Pull Request 会自动创建预览链接
- **部署历史**：可在 Vercel 控制台查看所有部署记录

### 注意事项

- Vercel 免费版限制：100GB 带宽/月，足够个人项目使用
- 构建时间限制：45 秒（Hobby 计划），通常足够
- 如需更多资源，可升级到 Pro 计划（$20/月）

---

## 方案二：GitHub Pages 部署

### 优势

- ✅ 完全免费
- ✅ 与 GitHub 仓库集成
- ✅ 支持自定义域名
- ✅ 适合开源项目展示

### 限制

- ⚠️ 需要手动配置构建和部署
- ⚠️ 国内访问速度较慢
- ⚠️ 存储限制 1GB

### 部署步骤

#### 步骤 1：修改 Vite 配置

修改 `vite.config.ts`，添加 base 路径：

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  base: process.env.NODE_ENV === 'production' 
    ? '/24h-urine-test-record/'  // 替换为你的仓库名
    : '/',
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
})
```

**重要**：将 `/24h-urine-test-record/` 替换为你的实际仓库名。

#### 步骤 2：创建 GitHub Actions 工作流

创建 `.github/workflows/deploy.yml` 文件：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main  # 或你的主分支名

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### 步骤 3：启用 GitHub Pages

1. **进入仓库设置**
   - 打开 GitHub 仓库
   - 点击 "Settings" → "Pages"

2. **配置 Pages 源**
   - **Source**: 选择 "GitHub Actions"
   - 保存设置

3. **等待首次部署**
   - 推送到 `main` 分支
   - 在 "Actions" 标签页查看部署进度
   - 部署完成后，访问地址会显示在 Pages 设置页面

#### 步骤 4：访问应用

- 默认地址：`https://your-username.github.io/24h-urine-test-record/`
- 替换 `your-username` 为你的 GitHub 用户名
- 替换 `24h-urine-test-record` 为你的仓库名

### 自定义域名配置

1. **创建 CNAME 文件**
   - 在 `public` 目录创建 `CNAME` 文件
   - 内容为你的域名（如：`urine-test.example.com`）
   - 提交并推送到仓库

2. **配置 DNS 记录**
   - 在域名服务商添加 CNAME 记录：
     - 类型：`CNAME`
     - 主机记录：`urine-test`（或 `@`）
     - 记录值：`your-username.github.io`

3. **等待生效**
   - DNS 生效通常需要几分钟到几小时
   - GitHub 会自动配置 HTTPS

### 注意事项

- GitHub Pages 仅支持静态网站
- 构建产物大小限制：1GB
- 带宽限制：100GB/月（通常足够）
- 如果仓库是私有的，需要 GitHub Pro 才能使用 Pages

---

## 方案三：微信公众号 H5 部署

### 说明

微信公众号 H5 实际上就是普通的 H5 网站，通过微信内置浏览器访问。需要确保：

1. ✅ 域名已备案（如果使用国内服务器）
2. ✅ 已配置 HTTPS 证书（微信要求）
3. ✅ 适配微信浏览器

### 推荐方案：使用 Vercel 部署

Vercel 已自动配置 HTTPS，无需额外操作，最适合微信公众号。

### 部署步骤

#### 步骤 1：部署到 Vercel

按照 [方案一：Vercel 部署](#方案一vercel-部署推荐) 的步骤完成部署。

#### 步骤 2：配置微信 JS-SDK（可选）

如果需要分享功能，需要配置微信 JS-SDK。

1. **在 `index.html` 中添加微信 JS-SDK**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta name="description" content="24小时尿蛋白检测记录系统" />
    <title>24小时尿蛋白检测记录</title>
    <script src="https://res.wx.qq.com/open/js/jweixin-1.6.0.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

2. **在微信公众号后台配置安全域名**
   - 登录微信公众平台
   - 设置 → 公众号设置 → 功能设置
   - 在 "JS 接口安全域名" 中添加你的域名（如：`urine-test.example.com`）

#### 步骤 3：优化移动端体验

确保 `index.html` 中的 viewport 配置正确（已配置）：

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

#### 步骤 4：在微信公众号中配置链接

1. **自定义菜单**
   - 登录微信公众平台
   - 功能 → 自定义菜单
   - 添加菜单项，链接指向部署的 H5 地址

2. **自动回复**
   - 功能 → 自动回复
   - 设置关键词回复，回复内容为 H5 链接

3. **图文消息**
   - 在图文消息中插入 H5 链接
   - 用户点击后可在微信内置浏览器中打开

### 微信浏览器兼容性测试

测试以下功能是否正常：

- ✅ IndexedDB 存储（微信浏览器支持）
- ✅ 路由跳转（React Router）
- ✅ 文件下载（Excel 导出、备份）
- ✅ 图表渲染（Chart.js）
- ✅ 表单输入

### 注意事项

- 微信内置浏览器基于 Chromium，兼容性较好
- 如果遇到问题，检查控制台错误信息
- 建议在真实微信环境中测试

---

## 方案四：微信小程序部署（需要改造）

### 重要说明

⚠️ **当前项目是 React H5 应用，要转换为微信小程序需要较大改造。**

### 方案对比

| 方案 | 优势 | 劣势 | 推荐度 |
|------|------|------|--------|
| Taro（React 语法） | 保持 React 语法，迁移成本低 | 需要学习 Taro API | ⭐⭐⭐⭐ |
| uni-app（Vue 语法） | 生态成熟，文档完善 | 需要改为 Vue 语法 | ⭐⭐⭐ |
| 原生小程序 | 性能最好 | 需要完全重写 | ⭐⭐ |

### 推荐方案：使用 Taro 框架

#### 为什么选择 Taro？

- ✅ 支持 React 语法，迁移成本最低
- ✅ 一套代码多端运行（微信、支付宝、H5 等）
- ✅ 社区活跃，文档完善

#### 改造步骤

##### 步骤 1：创建 Taro 项目

```bash
# 安装 Taro CLI
npm install -g @tarojs/cli

# 创建项目
taro init urine-test-miniprogram

# 选择配置
# - 框架：React
# - CSS 预处理器：Less/Sass
# - 模板：默认模板
```

##### 步骤 2：迁移代码结构

1. **迁移组件**
   - 将 `src/components` 迁移到 Taro 项目
   - 替换浏览器 API 为 Taro API
   - 使用 Taro 组件替代 HTML 标签

2. **迁移页面**
   - 将 `src/pages` 迁移到 Taro 项目
   - 使用 Taro 的路由系统

3. **迁移服务层**
   - 将 `src/services` 迁移
   - **重要**：IndexedDB → Taro 存储 API

##### 步骤 3：替换存储方案

**原代码（IndexedDB）**：
```typescript
// services/db.ts
import Dexie from 'dexie'
// ... IndexedDB 操作
```

**Taro 代码（本地存储）**：
```typescript
// services/db.ts
import Taro from '@tarojs/taro'

// 使用 Taro.setStorage 和 Taro.getStorage
// 或使用 Taro 的数据库 API（需要云开发）
```

**注意**：Taro 的本地存储有大小限制（10MB），如果数据量大，考虑：
- 使用云开发数据库
- 或使用第三方存储服务

##### 步骤 4：替换 UI 组件

**原代码（Ant Design Mobile）**：
```tsx
import { Button } from 'antd-mobile'
```

**Taro 代码（Taro UI 或自定义组件）**：
```tsx
import { Button } from '@tarojs/components'
// 或使用 Taro UI：https://taro-ui.jd.com/
```

##### 步骤 5：构建小程序

```bash
# 构建微信小程序
npm run build:weapp

# 构建产物在 dist 目录
```

##### 步骤 6：在微信开发者工具中打开

1. **下载微信开发者工具**
   - 访问：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

2. **导入项目**
   - 打开微信开发者工具
   - 选择 "导入项目"
   - 项目目录：选择 `dist` 目录
   - AppID：使用测试号或正式 AppID

3. **预览和调试**
   - 在开发者工具中预览
   - 使用真机调试功能

##### 步骤 7：上传代码

1. **在开发者工具中上传**
   - 点击 "上传" 按钮
   - 填写版本号和项目备注

2. **在微信公众平台提交审核**
   - 登录微信公众平台
   - 版本管理 → 开发版本 → 提交审核
   - 填写审核信息

3. **发布**
   - 审核通过后，点击 "发布"

### 数据存储方案对比

| 方案 | 容量限制 | 适用场景 | 成本 |
|------|---------|---------|------|
| 本地存储（Taro.setStorage） | 10MB | 小数据量 | 免费 |
| 云开发数据库 | 2GB（免费） | 中等数据量 | 免费/付费 |
| 云存储 | 5GB（免费） | 文件存储 | 免费/付费 |

**推荐**：对于本项目，如果数据量不大，使用本地存储即可。

### 注意事项

- 小程序有代码包大小限制（主包 2MB，总包 20MB）
- 需要配置合法域名（如果使用外部 API）
- 需要申请 AppID（个人可申请测试号）
- 审核时间通常 1-7 天

---

## 方案五：其他推荐平台

### 5.1 Netlify 部署

#### 优势

- ✅ 类似 Vercel，零配置
- ✅ 免费 HTTPS
- ✅ 支持表单处理
- ✅ 更好的 Git 集成

#### 部署步骤

1. **访问 Netlify**
   - 打开 https://netlify.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add new site" → "Import an existing project"
   - 选择 GitHub 仓库

3. **配置构建**
   - Build command: `npm run build`
   - Publish directory: `dist`

4. **部署**
   - 点击 "Deploy site"
   - 等待构建完成

5. **访问**
   - 默认地址：`https://random-name.netlify.app`
   - 可在设置中配置自定义域名

### 5.2 Cloudflare Pages 部署

#### 优势

- ✅ 全球 CDN 加速
- ✅ 免费额度高（500 次构建/月）
- ✅ 与 Cloudflare 生态集成

#### 部署步骤

1. **访问 Cloudflare Pages**
   - 打开 https://pages.cloudflare.com
   - 使用 Cloudflare 账号登录

2. **连接 GitHub**
   - 点击 "Create a project"
   - 选择 GitHub 仓库

3. **配置构建**
   - Framework preset: Vite
   - Build command: `npm run build`
   - Build output directory: `dist`

4. **部署**
   - 点击 "Save and Deploy"
   - 等待构建完成

5. **访问**
   - 默认地址：`https://your-project.pages.dev`
   - 可配置自定义域名

### 5.3 腾讯云静态网站托管

#### 优势

- ✅ 国内访问速度快
- ✅ 与微信生态集成好
- ✅ 支持 CDN 加速

#### 限制

- ⚠️ 需要备案（如果使用自定义域名）
- ⚠️ 需要付费（按量计费）

#### 部署步骤

1. **开通服务**
   - 登录腾讯云控制台
   - 搜索 "静态网站托管"
   - 开通服务

2. **创建存储桶**
   - 创建 COS 存储桶
   - 配置为静态网站托管

3. **上传文件**
   - 将 `dist` 目录下的所有文件上传到存储桶
   - 或使用 CLI 工具上传

4. **配置 CDN（可选）**
   - 开通 CDN 服务
   - 绑定存储桶
   - 配置加速域名

5. **访问**
   - 使用存储桶提供的访问地址
   - 或使用自定义域名（需备案）

---

## 部署前准备

### 1. 检查构建配置

确保 `package.json` 中有正确的构建脚本：

```json
{
  "scripts": {
    "build": "tsc && vite build"
  }
}
```

### 2. 测试本地构建

```bash
# 安装依赖
npm install

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 3. 检查路由配置

确保 SPA 路由配置正确（所有平台都需要）：

- Vercel：使用 `vercel.json` 配置
- GitHub Pages：使用 GitHub Actions 配置
- 其他平台：确保所有路由指向 `index.html`

### 4. 环境变量（如有）

如果项目使用环境变量，需要在部署平台配置：

- Vercel：项目设置 → Environment Variables
- Netlify：Site settings → Environment variables
- 其他平台：参考各自文档

### 5. 域名准备（可选）

- 购买域名（如：阿里云、腾讯云、Namecheap）
- 准备 DNS 配置

---

## 常见问题

### Q1: 部署后页面空白？

**原因**：通常是路由配置问题或 base 路径配置错误。

**解决方案**：
1. 检查 `vite.config.ts` 中的 `base` 配置
2. 确保所有路由都指向 `index.html`
3. 检查浏览器控制台错误信息

### Q2: GitHub Pages 部署后资源 404？

**原因**：base 路径配置不正确。

**解决方案**：
1. 确保 `vite.config.ts` 中的 `base` 设置为 `/仓库名/`
2. 重新构建并部署

### Q3: 微信浏览器中无法使用？

**原因**：可能是 HTTPS 未配置或域名未备案。

**解决方案**：
1. 确保使用 HTTPS（Vercel、Netlify 等自动配置）
2. 如果使用国内服务器，确保域名已备案
3. 检查微信公众平台的安全域名配置

### Q4: 小程序中 IndexedDB 不可用？

**原因**：小程序不支持 IndexedDB。

**解决方案**：
1. 使用 Taro 的存储 API：`Taro.setStorage` / `Taro.getStorage`
2. 或使用云开发数据库

### Q5: 构建失败？

**原因**：可能是依赖问题或 Node 版本不匹配。

**解决方案**：
1. 检查 `package-lock.json` 是否提交
2. 确保 Node 版本 >= 16.0.0
3. 查看构建日志中的错误信息

### Q6: 如何回滚到之前的版本？

**Vercel**：
- 在部署历史中选择之前的版本
- 点击 "Promote to Production"

**GitHub Pages**：
- 在 Actions 历史中找到之前的部署
- 重新运行该工作流

**其他平台**：参考各自平台的文档

---

## 推荐部署策略

### 主方案：Vercel + GitHub Pages（双部署）

1. **Vercel 作为主站**
   - 自动部署，访问速度快
   - 适合日常使用和分享
   - 地址：`https://your-project.vercel.app`

2. **GitHub Pages 作为备用**
   - 完全免费，开源展示
   - 适合作为备用访问地址
   - 地址：`https://your-username.github.io/your-project/`

### 微信生态：Vercel H5 + 考虑小程序

1. **短期方案**：使用 Vercel 部署 H5，在微信公众号中配置链接
   - 无需改造代码
   - 快速上线

2. **长期方案**：如果用户反馈需要小程序，使用 Taro 重构
   - 保持 React 语法
   - 一套代码多端运行

---

## 成本对比

| 平台 | 免费额度 | 自定义域名 | 国内访问速度 | 推荐度 |
|------|---------|-----------|------------|--------|
| Vercel | 100GB/月 | ✅ | 中等 | ⭐⭐⭐⭐⭐ |
| GitHub Pages | 1GB 存储 | ✅ | 较慢 | ⭐⭐⭐⭐ |
| Netlify | 100GB/月 | ✅ | 中等 | ⭐⭐⭐⭐⭐ |
| Cloudflare Pages | 500 次构建/月 | ✅ | 快 | ⭐⭐⭐⭐ |
| 腾讯云静态托管 | 5GB 存储 | ✅（需备案） | 快 | ⭐⭐⭐⭐ |
| 微信小程序 | 无限制 | ❌ | 快 | ⭐⭐⭐ |

---

## 总结

**最佳实践**：

1. **主站**：Vercel（快速、稳定、免费）
2. **备用**：GitHub Pages（开源展示）
3. **微信**：Vercel H5 链接（无需改造）
4. **小程序**：如需要，使用 Taro 重构（保持 React 语法）

所有方案都支持自定义域名，可根据需求选择。

---

## 相关资源

- [Vercel 文档](https://vercel.com/docs)
- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Taro 文档](https://taro.jd.com/docs/)
- [微信小程序文档](https://developers.weixin.qq.com/miniprogram/dev/framework/)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)

---

**文档版本**：1.0.0  
**最后更新**：2024-01-01  
**维护者**：开发团队
