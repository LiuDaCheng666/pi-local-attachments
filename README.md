# Pi Local Attachments

## 中文

这是一个面向 [Pi](https://github.com/badlogic/pi) 和 [Pi Web](https://github.com/agegr/pi-web) 的本地集成包。

它整合了三部分：

1. **Pi 扩展**：把 `read` 工具读取的图片转换为 Pi 图片消息；
2. **Pi Web 图片补丁**：在最终回答中识别本地图片路径并显示；
3. **Pi Web 文件粘贴补丁**：支持 `Ctrl+V` 粘贴普通文件，上传到当前本机项目、自动生成唯一文件名、显示文件卡片，并把新绝对路径传给 Pi Agent。

### 功能

- 在聊天中直接显示 PNG、JPEG、GIF、WebP、BMP 本地图片路径；
- 工具结果图片支持点击预览；
- 浏览器能提供 `File` 对象时，支持 `Ctrl+V` 粘贴文件；
- 粘贴文件后显示文件卡片，输入框保持干净；
- 自动为粘贴文件生成唯一文件名，避免同名新文件误读旧文件；
- 保留原始文件扩展名和文件内容；
- 聊天缩略图最大约为 480×360，点击后可以查看原图；
- 工具结果内嵌图片限制为 4 MiB；
- 不上传到云端，文件保存在运行 Pi Web 的本机当前项目目录；
- 直接粘贴文本路径时不复制文件，仍然支持原路径传递；
- 点击文件卡片的 `×` 会同时移除可见卡片和待发送附件，不再残留隐藏路径；
- 支持把 `![图片](E:\\目录\\图片.png)` 这类 Windows 本地 Markdown 图片路径自动转换为 Pi Web 文件接口。

### 安装 Pi 扩展

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

### 应用 Pi Web 补丁

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

### 本地刷新与缓存

本补丁还处理了本地 Pi Web 的 Service Worker 缓存问题：访问 `127.0.0.1` 或 `localhost` 时，Pi Web 会自动注销旧的 Service Worker 并清理旧缓存，不让旧版 `ChatInput` 代码导致文件粘贴失效。静态资源在网络可用时优先获取当前版本，离线时才使用缓存。

首次升级已有安装时，可能需要执行一次 `Ctrl+F5` 或在浏览器开发者工具中注销旧 Service Worker；之后启动 Pi Web 时会自动加载当前代码，不应再依赖强制刷新。

### 安全说明

建议让 Pi Web 只监听 `127.0.0.1`。补丁沿用 Pi Web 现有的允许目录和上传安全检查。不要把文件 API 暴露到公网。解压或执行粘贴的压缩包、脚本前必须先检查内容。

本项目是独立的 Pi/Pi Web 集成项目，不是 Pi 或 Pi Web 官方发布版本。

---

## English

A local integration package for [Pi](https://github.com/badlogic/pi) and [Pi Web](https://github.com/agegr/pi-web).

It combines three parts:

1. A **Pi extension** that converts image results from the `read` tool into Pi image content;
2. A **Pi Web image patch** that renders local image paths in final assistant messages;
3. A **Pi Web clipboard-file patch** that accepts `Ctrl+V` files, stores them in the current local project with unique names, shows a file card, and passes the new absolute path to Pi Agent.

### Features

- Render local PNG, JPEG, GIF, WebP, and BMP paths directly in chat;
- Clickable previews for tool-result images;
- Paste clipboard files with `Ctrl+V` when the browser exposes a `File` object;
- Keep the composer clean while passing pasted-file paths as internal attachment metadata;
- Generate unique names for pasted files so changed files with the same original name are not confused with older uploads;
- Preserve the original extension and file content;
- Keep chat thumbnails at up to 480×360, with click-to-open full-size previews;
- Cap inline tool-result images at 4 MiB;
- Keep files on the local machine instead of uploading them to a cloud service;
- Preserve direct text-path pasting without copying the file;
- Removing a file card also removes its pending attachment metadata;
- Convert Windows local Markdown image destinations such as `![image](E:\\folder\\image.png)` to the Pi Web file API before Markdown parsing.

### Install the Pi extension

Copy:

```text
extensions/image-tool-results.ts
```

to:

```text
<PI_CODING_AGENT_DIR>/extensions/
```

Then run `/reload` in Pi or restart the Pi runtime.

### Apply the Pi Web patch

Prepare a local Git checkout of Pi Web and run:

```powershell
.\scripts\apply-piweb-patch.ps1 `
  -SourceDir 'C:\path\to\pi-web-source' `
  -InstallDependencies
```

Start Pi Web from the patched checkout. The patch targets Pi Web 0.9.x and may need updates when upstream changes.

### Clipboard behavior

- Pasting a text path such as `E:\models\scene.zip` does not upload anything; the path is displayed and passed as text;
- Pasting a real clipboard `File` uploads it to the local project and generates a unique name such as `scene__paste_20260925_ab12c.zip`;
- Pi Agent receives the new path and can read or process it with local tools;
- File bytes are not inserted into model context automatically; they enter context only when the Agent explicitly reads them.

### Local refresh and caching

The patch also handles the local Pi Web Service Worker cache. When running on `127.0.0.1` or `localhost`, Pi Web automatically unregisters old Service Workers and clears stale caches so an old `ChatInput` bundle cannot disable file paste. Static assets prefer the current network version and fall back to cache only when offline.

After upgrading an existing installation, you may need one `Ctrl+F5` or one manual Service Worker unregister in browser developer tools. After that, starting Pi Web should load the current code without requiring a hard refresh.

### Security

Keep Pi Web bound to `127.0.0.1` unless remote access is deliberately secured. The patch uses Pi Web's existing allowed-root and upload checks. Do not expose the file API to the public internet. Review pasted archives and scripts before extracting or executing them.

This is an independent Pi/Pi Web integration project, not an official Pi or Pi Web release.

## License

MIT License. See [LICENSE](LICENSE).
