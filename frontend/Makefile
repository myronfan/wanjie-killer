# 完结杀手 - 懒人自动化命令
# 用法：
#   make help        查看所有命令
#   make install     安装依赖
#   make dev         启动开发服务器
#   make build       打包前端到 dist/
#   make electron    用 Electron 运行（带窗口）
#   make dist        打包 Windows EXE
#   make clean       清理构建产物

.PHONY: help install dev build electron dist clean check

help:
	@echo "完结杀手 - 可用命令："
	@echo ""
	@echo "  make install  - 安装依赖（npm install）"
	@echo "  make dev      - 启动开发服务器（http://localhost:5173）"
	@echo "  make build    - 构建前端到 dist/"
	@echo "  make electron - 用 Electron 启动应用（带原生窗口）"
	@echo "  make dist     - 打包 Windows EXE（输出到 release/）"
	@echo "  make clean    - 清理构建产物"
	@echo "  make check    - 检查环境（Node.js、npm）"
	@echo ""

check:
	@echo "检查环境..."
	@node --version || (echo "❌ 需要 Node.js 18+" && exit 1)
	@npm --version || (echo "❌ 需要 npm" && exit 1)
	@echo "✅ 环境正常"

install: check
	@echo "安装依赖..."
	@npm install
	@echo "✅ 依赖安装完成"

dev:
	@echo "启动开发服务器..."
	@npm run dev

build:
	@echo "构建前端..."
	@npm run build
	@echo "✅ 构建完成，输出在 dist/"

electron: build
	@echo "启动 Electron..."
	@npm run electron:dev

dist:
	@echo "打包 Windows EXE..."
	@npm run electron:build
	@echo "✅ EXE 打包完成，输出在 release/"

clean:
	@echo "清理构建产物..."
	@rm -rf dist release node_modules/.cache .vite
	@echo "✅ 清理完成"
