# Pi Image Display & Clipboard Files

[English](#english) · [简体中文](#中文)

<a name="english"></a>
## English

A local integration package for [Pi](https://github.com/badlogic/pi) and [Pi Web](https://github.com/agegr/pi-web).

It connects three pieces:

1. A Pi extension that converts image results from the `read` tool into Pi image content.
2. A Pi Web patch that renders local image paths in final assistant messages.
3. A Pi Web chat-input patch that accepts clipboard files, uploads them to the current local project, renames them safely, shows a file card, and passes the resulting absolute path to Pi.

### Features

- Display local PNG/JPEG/GIF/WebP/BMP paths directly in chat.
- Render tool-result images with clickable previews.
- Paste clipboard files with `Ctrl+V` when the browser exposes a `File` object.
- Keep the composer clean: pasted-file paths are attached as internal metadata and are not shown as raw path text in the visible user bubble.
- Add unique names to pasted files, preventing a changed file with the same original name from being mistaken for an older upload.
- Preserve the original extension and file content.
- Keep thumbnails compact at up to 480×360; click to open the full-size preview.
- Inline tool-result images are capped at 4 MiB.
- No cloud upload: files are stored by the local Pi Web server in the current project.
- Normal text path pasting remains supported without uploading.

### Installation

#### Install the Pi extension

Copy:

```text
extensions/image-tool-results.ts
```

to:

```text
<PI_CODING_AGENT_DIR>/extensions/
```

Then run `/reload` in Pi or restart the Pi runtime.

#### Apply the Pi Web patch

Use a local Git checkout of Pi Web:

```powershell
.\scripts\apply-piweb-patch.ps1 `
  -SourceDir 'C:\path\to\pi-web-source' `
  -InstallDependencies
```

Start Pi Web from the patched checkout. The patch is intended for Pi Web 0.9.x and may need updates when upstream changes.

### Clipboard behavior

- Pasting a text path such as `E:\models\scene.zip` does not upload anything; Pi Web validates/displays the path and sends it as text.
- Pasting a real clipboard `File` uploads it to the local project using a unique name such as `scene__paste_20260925_ab12c.zip`.
- The model receives the resulting path and can use Pi tools to read or process it.
- The file bytes are not inserted into the model context automatically.

### Security

Keep Pi Web bound to `127.0.0.1` unless remote access is deliberately secured. The patch uses Pi Web's existing allowed-root and upload checks. Do not expose the file API to the public internet. Review pasted archives before extracting or executing anything.

This package is an independent integration project, not an official Pi or Pi Web release.

---

<a name="中文"></a>
## 中文

这是一个面向 [Pi](https://github.com/badlogic/pi) 和 [Pi Web](https://github.com/agegr/pi-web) 的本地集成包。

它整合了三部分：

1. Pi 扩展：把 `read` 工具读取的图片转换为 Pi 图片消息；
2. Pi Web 补丁：在最终回答中识别本地图片路径并显示；
3. Pi Web 输入框补丁：支持 `Ctrl+V` 粘贴普通文件，上传到当前本机项目、自动重命名、显示文件卡片，并把新绝对路径传给 Pi Agent。

### 功能

- 在聊天中直接显示 PNG/JPEG/GIF/WebP/BMP 本地图片路径；
- 工具结果图片支持点击预览；
- 浏览器能提供 `File` 对象时，支持 `Ctrl+V` 粘贴文件；
- 粘贴文件后输入框保持干净，路径作为内部附件信息传给 Agent；
- 自动为粘贴文件生成唯一文件名，避免同名新文件误读旧文件；
- 保留原始文件扩展名和内容；
- 聊天缩略图最大约 480×360，点击后可查看原图；
- 工具结果内嵌图片限制为 4 MiB；
- 不上传到云端，文件保存在运行 Pi Web 的本机当前项目目录；
- 直接粘贴文本路径时不复制文件，仍然支持原路径传递。

### 安装

#### 安装 Pi 扩展

复制：

```text
extensions/image-tool-results.ts
```

到：

```text
<PI_CODING_AGENT_DIR>/extensions/
```

然后在 Pi 中执行：

```text
/reload
```

或重启 Pi Runtime。

#### 应用 Pi Web 补丁

准备一个 Pi Web 的本地 Git 源码目录，然后执行：

```powershell
.\scripts\apply-piweb-patch.ps1 `
  -SourceDir 'C:\path\to\pi-web-source' `
  -InstallDependencies
```

之后从打过补丁的源码目录启动 Pi Web。本补丁面向 Pi Web 0.9.x；上游源码发生变化后可能需要重新适配。

### 粘贴行为

- 粘贴 `E:\models\scene.zip` 这类文本路径：不会上传文件，只检查/显示路径并作为文本传给 Agent；
- 粘贴真实剪贴板文件：上传到本机当前项目，并生成类似 `scene__paste_20260925_ab12c.zip` 的唯一文件名；
- Agent 收到新路径后，可以使用 Pi 工具读取或处理；
- 文件内容不会自动塞入模型上下文，只有 Agent 主动读取时才会进入上下文。

### 安全说明

建议让 Pi Web 只监听 `127.0.0.1`。补丁沿用 Pi Web 现有的允许目录和上传安全检查。不要把文件 API 暴露到公网。解压或执行粘贴的压缩包、脚本前必须先检查内容。

本项目是独立的 Pi/Pi Web 集成项目，不是 Pi 或 Pi Web 官方发布版本。

## License

MIT License. See [LICENSE](LICENSE).
