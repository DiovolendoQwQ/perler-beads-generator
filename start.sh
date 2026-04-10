#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== 拼豆教程生成器 - 一键启动脚本 ===${NC}\n"

# 1. 检查和启动后端服务
echo -e "${YELLOW}[1/3] 正在检查和启动后端 FastAPI 服务...${NC}"
cd backend || { echo -e "${RED}找不到 backend 目录！${NC}"; exit 1; }

# 检查 Python 虚拟环境
if [ ! -d "venv" ]; then
    echo "未找到虚拟环境，正在创建..."
    python3 -m venv venv
fi

# 激活虚拟环境并安装依赖
echo "激活虚拟环境并安装依赖..."
source venv/bin/activate
pip install -r requirements.txt -q

# 启动 FastAPI 后端（在后台运行）
echo "正在后台启动后端服务 (端口 8000)..."
python main.py > backend.log 2>&1 &
BACKEND_PID=$!
echo "后端进程 PID: $BACKEND_PID"

# 检查后端是否成功启动
sleep 3
if ps -p $BACKEND_PID > /dev/null; then
   echo -e "${GREEN}后端服务启动成功！${NC}\n"
else
   echo -e "${RED}后端服务启动失败，请检查 backend/backend.log${NC}"
   exit 1
fi

# 2. 检查和启动前端服务
echo -e "${YELLOW}[2/3] 正在检查和启动前端 React 服务...${NC}"
cd ..

# 安装前端依赖
echo "检查前端依赖..."
if [ ! -d "node_modules" ]; then
    echo "未找到 node_modules，正在执行 npm install..."
    npm install
fi

# 启动 Vite 前端（在后台运行）
echo "正在后台启动前端服务..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端进程 PID: $FRONTEND_PID"

# 检查前端是否成功启动
sleep 3
if ps -p $FRONTEND_PID > /dev/null; then
   echo -e "${GREEN}前端服务启动成功！${NC}\n"
else
   echo -e "${RED}前端服务启动失败，请检查 frontend.log${NC}"
   kill $BACKEND_PID
   exit 1
fi

# 3. 提供访问链接和退出说明
echo -e "${YELLOW}[3/3] 服务运行状态与访问信息${NC}"
echo "--------------------------------------------------------"
echo -e "前端访问地址: ${GREEN}http://localhost:5173${NC}"
echo -e "后端 API 地址: ${GREEN}http://localhost:8000${NC}"
echo "--------------------------------------------------------"
echo -e "${YELLOW}提示: 按 [Ctrl+C] 可停止所有服务并退出${NC}"

# 捕获 Ctrl+C 并清理后台进程
trap 'echo -e "\n${RED}正在停止所有服务...${NC}"; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT

# 保持脚本运行，以监控服务状态
wait
