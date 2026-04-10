# 图像卡通化与动漫化全栈集成方案

## 1. 方案摘要 (Summary)
本方案旨在为“拼豆教程生成器”项目增加**图像卡通化/动漫化**的前置处理功能。通过集成两种不同量级的 AI 算法：**GAN (轻量级/极速版)** 和 **Diffusion (重量级/高清版)**，满足用户在生成拼豆图纸前对原图进行风格化处理的需求。系统采用**前后端分离**架构，前端使用现有的 React 框架进行 UI 升级，后端采用 **FastAPI + Celery + Redis** 架构以应对复杂的 AI 模型推理任务。

## 2. 当前状态分析 (Current State Analysis)
- **前端环境**：基于 React + Vite + Tailwind CSS 构建，状态管理使用 Zustand (`src/store/useAppStore.ts`)。当前仅支持用户上传图片 (`UploadPanel.tsx`) 后，直接根据像素和缩放比例将其处理成拼豆风格图纸 (`PreviewCanvas.tsx`)。
- **后端环境**：目前属于纯前端项目，暂无后端支撑。为了集成这两种算法，需要从零搭建一个基于 Python 的后端 API 服务，负责执行繁重的图像生成任务。
- **缺失能力**：无图像前置风格化能力，缺乏异步任务处理和进度反馈机制。

## 3. 拟定更改方案 (Proposed Changes)

### 3.1 前端应用改造
**1. 状态管理 (`src/store/useAppStore.ts`)**
- 增加处理状态字段：`isCartoonizing` (是否正在处理中)。
- 增加进度反馈字段：`cartoonizeProgress` (进度条 0-100)，`cartoonizeStatus` (当前任务的文本提示，如"排队中", "生成中")。

**2. UI 组件改造 (`src/components/UploadPanel.tsx`)**
- **新增风格化操作区**：在图片上传成功后，展示三个风格选项：“保持原图”、“快速动漫化 (极速版)”、“精细插画化 (高清版)”。
- **新增加载与进度条 UI**：
  - 当选择“快速动漫化”时，显示局部 Loading 动画（该接口响应较快，无需进度条）。
  - 当选择“精细插画化”时，显示进度条 (Progress Bar)，实时显示 `cartoonizeProgress` 的百分比和当前状态文本。
- **逻辑对接**：用户确认风格后，将 `originalImage`（原图 Base64）发往后端，并将后端返回的风格化图片覆盖至 `originalImage`，供后续拼豆生成流程使用。

### 3.2 后端架构设计 (新微服务)
使用 **Python + FastAPI** 搭建微服务。架构分为两层：**同步极速层**与**异步高清层**。

**1. 依赖与基础设施**
- Web 框架：`FastAPI` (提供高性能的 API 路由)。
- 任务队列：`Celery` + `Redis` (处理耗时较长的 Diffusion 任务，缓存任务状态)。
- 模型框架：`ONNX Runtime` (GAN 推理) 和 `diffusers` (Stable Diffusion 推理)。

**2. API 接口设计**
- `POST /api/cartoonize/fast`：
  - **功能**：调用轻量级 GAN 模型 (如 AnimeGANv2 的 ONNX 版本)。
  - **特点**：同步接口，耗时短（通常几百毫秒），接收图片 Base64，直接返回处理后的 Base64 图像。
- `POST /api/cartoonize/high-quality`：
  - **功能**：调用 Diffusion 模型 (如 Stable Diffusion + ControlNet)。
  - **特点**：异步接口，接收图片 Base64，将任务推送给 Celery 队列，并立即返回一个唯一的 `task_id`。
- `GET /api/tasks/{task_id}`：
  - **功能**：轮询接口，供前端每隔 1-2 秒请求一次。
  - **返回格式**：`{"status": "PROCESSING", "progress": 45, "result": null}`。当进度达 100 且状态为 `COMPLETED` 时，`result` 返回最终生成的 Base64 图像。

**3. Celery Worker (任务处理器)**
- 初始化时加载 Stable Diffusion 权重至 GPU 显存。
- 执行任务时，通过回调函数 (Callback) 定期更新 Redis 中的 `task_id` 对应的 `progress` 字段（例如扩散模型跑完一个 step，进度更新 1/steps）。

## 4. 假设与决策 (Assumptions & Decisions)
- **决策1**：前端轮询 vs WebSocket。为了降低部署复杂度和兼容性风险，采用**HTTP 短轮询 (Polling)**的方式获取 Diffusion 任务进度，对于单张图片处理的场景已足够使用。
- **决策2**：模型选型。快速方案选用 **AnimeGANv2**，因为其无需 GPU 也能快速出图；高质量方案选用 **Stable Diffusion 1.5 + ControlNet (Lineart/Canny)**，画质最稳定且对显存要求相对可控（单卡 8GB 显存即可运行）。
- **假设**：后端将作为一个独立的服务运行（如通过 Docker Compose 部署），前端会在 `vite.config.ts` 中配置代理 `/api` 指向后端服务，避免跨域问题。

## 5. 验证步骤 (Verification Steps)
1. **启动后端服务**：启动 Redis，启动 FastAPI 主进程，启动 Celery Worker。
2. **启动前端**：运行 `npm run dev`。
3. **极速模式测试**：上传一张图片，点击“快速动漫化”，验证是否能在 1-2 秒内更新并显示动漫化效果。
4. **高清模式测试**：上传同一张图片，点击“精细插画化”，验证 UI 是否正确弹出进度条并随时间递增，最终（约 10-30 秒后）正确显示精美的插画风格图片。
5. **完整工作流测试**：应用上述任意一种动漫化效果后，点击“生成拼豆图纸”，验证原有的像素化流程是否正常基于新生成的卡通化图片进行处理。