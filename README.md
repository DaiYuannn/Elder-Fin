# Elder-Fin 老年财经伴侣中枢平台

当前仓库已经统一为 React + Vite 主工程，包含：

- 首页与登录分流
- 老人端首页、风险检测、理财陪伴、家属授权
- 家属看板与外呼记录
- B 端联合干预中枢
- C 端、家属端、B 端本地模式共享同一套模拟 alerts、contacts、outreachLogs 数据

## 本地开发

```bash
npm install
npm run dev
```

默认访问地址：

- http://localhost:5173/

## 本地打包预览

```bash
npm run build
npm run preview
```

## GitHub Pages 托管

当前项目已经适配纯静态托管：

- Vite 使用相对资源路径
- 路由采用 HashRouter，适合静态站点
- 已提供 gh-pages 发布脚本
- 已提供 GitHub Actions 自动部署工作流

### 自动发布

1. 将仓库推送到 GitHub。
2. 打开仓库的 Settings > Pages。
3. 在 Build and deployment 中选择 GitHub Actions。
4. 之后只要推送到 main 分支，就会自动构建并发布。

GitHub Pages 地址通常为：

```text
https://<GitHub 用户名>.github.io/<仓库名>/
```

### 手动发布

```bash
npm install
npm run deploy
```

该命令会先构建，再把 dist 发布到 gh-pages 分支。

## 给没有环境的组员查看

最方便的方式是直接发 GitHub Pages 链接。这样组员只需要浏览器，不需要安装 Node.js 或执行 npm run dev。
