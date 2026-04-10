@echo off
chcp 65001 >nul
color 0A

echo === 拼豆教程生成器 - Windows 一键启动脚本 ===
echo.

:: 1. 启动后端服务
echo [1/3] 正在检查和启动后端 FastAPI 服务...
if not exist backend (
    color 0C
    echo 找不到 backend 目录！
    pause
    exit /b 1
)

cd backend

:: 检查虚拟环境
if not exist venv (
    echo 未找到虚拟环境，正在创建...
    python -m venv venv
)

:: 激活虚拟环境并安装依赖
echo 激活虚拟环境并安装依赖...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q

:: 启动后端 (新窗口)
echo 正在新窗口中启动后端服务 (端口 8000)...
start "FastAPI Backend" cmd /c "call venv\Scripts\activate.bat && python main.py"

cd ..

:: 2. 启动前端服务
echo.
echo [2/3] 正在检查和启动前端 React 服务...

:: 检查 node_modules
if not exist node_modules (
    echo 未找到 node_modules，正在执行 npm install...
    call npm install
)

:: 启动前端 (新窗口)
echo 正在新窗口中启动前端服务...
start "Vite Frontend" cmd /c "npm run dev"

:: 3. 提示信息
echo.
color 0B
echo [3/3] 服务已在独立窗口中启动！
echo --------------------------------------------------------
echo 前端访问地址: http://localhost:5173
echo 后端 API 地址: http://localhost:8000
echo --------------------------------------------------------
echo 提示: 想要停止服务，请直接关闭弹出的两个黑色命令行窗口即可。
echo.
pause
