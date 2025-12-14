# 快速部署指南

本文档提供最快速的部署方法，适合想要立即上线的用户。

## 🚀 5分钟快速部署到 Vercel（推荐）

### 步骤 1：准备代码

确保代码已推送到 GitHub：

```bash
git add .
git commit -m "准备部署"
git push origin main
```

### 步骤 2：部署到 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的仓库 `24h-urine-test-record`
5. 点击 "Import"
6. 确认配置（通常自动检测正确）：
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. 点击 "Deploy"
8. 等待 1-2 分钟，部署完成！

### 步骤 3：访问应用

部署完成后，你会得到一个地址：
- `https://24h-urine-test-record.vercel.app`

**完成！** 🎉

---

## 📦 10分钟部署到 GitHub Pages

### 步骤 1：修改 Vite 配置

编辑 `vite.config.ts`，添加 base 路径：

```typescript
export default defineConfig({
  // ... 其他配置
  base: process.env.NODE_ENV === 'production' 
    ? '/24h-urine-test-record/'  // 替换为你的仓库名
    : '/',
})
```

### 步骤 2：创建 GitHub Actions 工作流

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

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
        uses: actions/deploy-pages@v4
```

### 步骤 3：启用 GitHub Pages

1. 打开 GitHub 仓库
2. Settings → Pages
3. Source 选择 "GitHub Actions"
4. 保存

### 步骤 4：推送代码

```bash
git add .
git commit -m "配置 GitHub Pages 部署"
git push origin main
```

### 步骤 5：等待部署

1. 在 GitHub 仓库的 "Actions" 标签页查看部署进度
2. 部署完成后，访问：`https://your-username.github.io/24h-urine-test-record/`

**完成！** 🎉

---

## 📱 微信公众号部署（使用 Vercel）

### 步骤 1：部署到 Vercel

按照上面的 "5分钟快速部署到 Vercel" 完成部署。

### 步骤 2：在微信公众号中配置

1. 登录微信公众平台
2. 功能 → 自定义菜单
3. 添加菜单项，链接指向 Vercel 地址
4. 保存并发布

**完成！** 🎉

---

## ⚠️ 常见问题快速解决

### 问题 1：部署后页面空白

**解决**：检查 `vite.config.ts` 中的 `base` 配置是否正确。

### 问题 2：GitHub Pages 资源 404

**解决**：确保 `base` 设置为 `/仓库名/`，重新构建。

### 问题 3：构建失败

**解决**：
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📚 详细文档

如需更详细的配置说明，请查看 [DEPLOYMENT.md](./DEPLOYMENT.md)。

---

**提示**：推荐使用 Vercel，最简单快速！
