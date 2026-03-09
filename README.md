# Elder-Fin 老年财经伴侣中枢平台

Elder-Fin 是一个面向银发用户、家属协同与机构处置人员的金融安全演示平台。当前仓库已经统一为 React + Vite 主工程，目标是把老人端、家属端与 B 端联合干预中枢收拢到同一套前端底座中。

## 项目概览

- 老人端：提供风险检测、理财陪伴、家属授权与今日守护状态
- 家属端：提供风险摘要、联系人信息、外呼记录与确认结果
- B 端：提供 Elder-Fin 联合干预中枢，包含地图态势、总览信息、家庭协同流和风险流
- 统一状态层：C 端、家属端、B 端本地模式共享 alerts、contacts、outreachLogs
- 纯静态托管友好：已适配 GitHub Pages

## 技术栈

- React 18
- Vite 6
- React Router
- Zustand
- Tailwind CSS
- deck.gl + MapLibre GL

## 当前目录结构

```text
.
├─ src/                  # 主 React 应用
├─ src/biz/              # B 端联合干预中枢运行源码
├─ pages/                # 旧静态页面参考
├─ assets/               # 旧静态资源参考
├─ biz-console/          # 早期独立 B 端工程参考
├─ .github/workflows/    # GitHub Actions 发布流程
└─ PROJECT_TASK_PATH.md  # 当前项目任务路径与规则
```

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

1. 打开仓库 Settings > Pages。
2. 在 Build and deployment 中选择 GitHub Actions。
3. 之后推送到 main 分支时会自动构建并发布。

### 手动发布

```bash
npm install
npm run deploy
```

该命令会先构建，再把 dist 发布到 gh-pages 分支。

## 团队查看方式

最方便的方式是直接使用 GitHub Pages 链接。这样组员只需要浏览器，不需要安装 Node.js，也不需要执行 npm run dev。

## 后续重点

- 继续收束三端共享数据模型
- 优化 B 端大体积分包与首屏加载
- 接入真实后端接口与实时数据流
