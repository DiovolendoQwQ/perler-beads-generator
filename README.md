# 拼豆图纸生成器

一款专为拼豆（Perler Beads / Mard / Artkal）爱好者设计的网页应用。通过上传图片，自动将其转换为马赛克像素风格的拼豆图纸，并精确匹配专业拼豆色号，同时统计所需耗材数量。

## 功能特性

- 📤 **图片上传**：支持拖拽或点击上传本地图片（JPG/PNG）
- 🎨 **多色卡支持**：内置 Mard 221 色，支持 Perler、Artkal 等色卡品牌
- 📐 **尺寸设置**：可自定义目标拼豆网格尺寸（如 50x50）
- 👁️ **图纸预览**：实时预览转换后的像素马赛克图纸，支持网格叠加
- 🏷️ **色号显示**：网格内可选择显示色号代码
- 📊 **耗材统计**：自动汇总所需色号及对应的耗材数量
- 📱 **响应式设计**：桌面端优先，移动端自适应

## 技术栈

- **框架**：React 18 + TypeScript + Vite
- **样式**：Tailwind CSS
- **状态管理**：Zustand
- **图标**：Lucide React
- **动画**：Framer Motion
- **图像处理**：HTML5 Canvas API

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 生产构建

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```

## 项目结构

```
src/
├── components/          # UI 组件
│   ├── Empty.tsx
│   ├── MaterialStats.tsx    # 耗材统计组件
│   ├── PreviewCanvas.tsx   # 图纸预览画布
│   ├── UploadPanel.tsx     # 图片上传面板
│   └── Workspace.tsx       # 工作台容器
├── data/
│   └── palettes.ts         # 色卡数据
├── hooks/
│   └── useTheme.ts         # 主题切换
├── lib/
│   └── utils.ts            # 工具函数
├── pages/
│   └── Home.tsx            # 主页
├── store/
│   └── useAppStore.ts      # 全局状态管理
├── utils/
│   ├── colorMatcher.ts     # 颜色匹配算法
│   └── imageProcessor.ts   # 图像处理模块
├── App.tsx
├── main.tsx
└── index.css
```

## 核心原理

应用使用 HTML5 Canvas API 获取图片像素数据，通过缩放实现马赛克效果。然后对每个像素块的 RGB 值与色卡库进行欧几里得距离比对，找到最接近的色号。

```javascript
// 颜色距离计算示例
const distance = Math.sqrt(
  Math.pow(r1 - r2, 2) +
  Math.pow(g1 - g2, 2) +
  Math.pow(b1 - b2, 2)
);
```

## 许可证

MIT
