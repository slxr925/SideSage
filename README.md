# SideSage

**[English](#english) · [中文](#中文)**

---

<a id="中文"></a>

一个 Chrome 浏览器扩展，在任何网页上选中文字后，通过悬浮按钮快速调用 AI 进行提问、翻译、总结、解释和改写。同时在右侧边栏提供完整的 AI 对话功能，支持附加当前网页内容作为上下文。

## 功能

- **悬浮按钮**：选中文字后出现，包含提问、翻译、总结、改写四个快捷操作
- **右侧边栏对话**：完整的 AI 对话界面，支持流式输出和 Markdown 渲染
- **附加网页**：在边栏对话中一键附加当前页面内容，让 AI 基于网页上下文回答问题
- **右键菜单**：选中文字后右键可直接提问、总结、翻译、解释
- **改写功能**：在可编辑区域选中文字后，弹出改写面板，支持选择改写方向、多次迭代
- **中英文切换**：设置面板支持界面语言切换（中文 / English）
- **暗黑模式**：自动跟随系统暗黑模式
- **直连 AI 服务**：扩展直接调用 OpenAI 兼容 API，无需部署中间服务器
- **隐私安全**：不记录用户对话，无多对话记忆功能；API Key 仅保存在本地浏览器中，不会上传到任何服务器

## 安装

SideSage 已在 Chrome 应用商店上线，欢迎安装使用！

1. 访问 [Chrome Web Store](https://chromewebstore.google.com) 搜索 **SideSage**，点击 **添加至 Chrome**
2. 安装完成后，工具栏出现 SideSage 图标，即可使用。

## 配置

打开右侧边栏，点击设置图标（齿轮），填入以下信息：

| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| 语言 | 界面显示语言 | English |
| API Key | AI 服务的 API 密钥 | - |
| Provider Base URL | AI 服务商 API 地址 | `https://api.openai.com/v1` |
| Model | 模型名称 | `gpt-4.1-mini` |

支持任何 OpenAI 兼容的 API 服务（如 DeepSeek、Groq、硅基流动等），只需将 Provider Base URL 改为对应服务的 API 地址即可。

## 使用

### 选中文字后

页面上出现橙色悬浮按钮，包含四个操作：

- **提问**：弹出对话框，输入问题后 AI 基于选中文字回答
- **翻译**：自动将选中文字翻译（中英互译，其他语言译为英文）
- **总结**：自动总结选中文字的核心要点
- **改写**：弹出改写面板，可选择改写方向（更清晰/更简短/更专业/更亲切），支持多次迭代

### 右侧边栏

- 在输入框输入问题，回车或点击发送按钮与 AI 对话
- 点击回形针按钮可附加当前页面内容，AI 将基于网页上下文回答
- 点击 `+` 按钮开始新对话

### 右键菜单

选中文字后右键，选择 SideSage 的对应操作。

---

<a id="english"></a>

A Chrome extension that lets you select any text on a webpage and instantly ask, translate, summarize, explain, or rewrite it with AI — via a floating toolbar, right-click menu, or a full side panel conversation with page context support.

## Features

- **Floating Toolbar** — Appears on text selection with Ask, Translate, Summarize, and Rewrite actions
- **Side Panel Chat** — Full AI conversation interface with streaming responses and Markdown rendering
- **Attach Page** — One-click to attach current page content as context for AI responses
- **Context Menu** — Right-click selected text to Ask, Summarize, Translate, Explain, or Rewrite
- **Rewrite** — Opens a rewrite panel in editable fields with direction presets (clearer, shorter, professional, friendlier) and iterative refinement
- **Bilingual UI** — Switch between English and Chinese in settings
- **Dark Mode** — Automatically follows your system theme
- **Direct API Connection** — Calls any OpenAI-compatible API directly, no server needed
- **Privacy First** — No conversation logging; API key stored locally, never uploaded

## Installation

SideSage is now available on the Chrome Web Store!

1. Visit [Chrome Web Store](https://chromewebstore.google.com) and search for **SideSage**, then click **Add to Chrome**
2. Once installed, the SideSage icon appears in your toolbar — click it to get started.

## Configuration

Open the side panel and click the settings icon (gear). Fill in:

| Setting | Description | Default |
|---------|-------------|---------|
| Language | UI display language | English |
| API Key | Your AI service API key | - |
| Provider Base URL | AI provider API endpoint | `https://api.openai.com/v1` |
| Model | Model name | `gpt-4.1-mini` |

Works with any OpenAI-compatible API provider (DeepSeek, Groq, SiliconFlow, etc.) — just change the Provider Base URL to the corresponding endpoint.

## Usage

### After Selecting Text

An orange floating toolbar appears with four actions:

- **Ask** — Opens a dialog where you type a question and AI answers based on the selected text
- **Translate** — Auto-translates (Chinese ↔ English, other languages to English)
- **Summarize** — Generates a concise summary of the selected text
- **Rewrite** — Opens a rewrite panel with direction presets (clearer / shorter / professional / friendlier), supports iterative refinement

### Side Panel

- Type a question and press Enter or click Send to chat with AI
- Click the paperclip button to attach the current page content as context
- Click `+` to start a new conversation

### Context Menu

Select text, right-click, and choose a SideSage action.
