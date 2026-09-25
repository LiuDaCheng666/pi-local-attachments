# Pi Local Attachments

[English](#english) 路 [绠€浣撲腑鏂嘳(#涓枃)

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
- Keep thumbnails compact at up to 480脳360; click to open the full-size preview.
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

<a name="涓枃"></a>
## 涓枃

杩欐槸涓€涓潰鍚?[Pi](https://github.com/badlogic/pi) 鍜?[Pi Web](https://github.com/agegr/pi-web) 鐨勬湰鍦伴泦鎴愬寘銆?
瀹冩暣鍚堜簡涓夐儴鍒嗭細

1. Pi 鎵╁睍锛氭妸 `read` 宸ュ叿璇诲彇鐨勫浘鐗囪浆鎹负 Pi 鍥剧墖娑堟伅锛?2. Pi Web 琛ヤ竵锛氬湪鏈€缁堝洖绛斾腑璇嗗埆鏈湴鍥剧墖璺緞骞舵樉绀猴紱
3. Pi Web 杈撳叆妗嗚ˉ涓侊細鏀寔 `Ctrl+V` 绮樿创鏅€氭枃浠讹紝涓婁紶鍒板綋鍓嶆湰鏈洪」鐩€佽嚜鍔ㄩ噸鍛藉悕銆佹樉绀烘枃浠跺崱鐗囷紝骞舵妸鏂扮粷瀵硅矾寰勪紶缁?Pi Agent銆?
### 鍔熻兘

- 鍦ㄨ亰澶╀腑鐩存帴鏄剧ず PNG/JPEG/GIF/WebP/BMP 鏈湴鍥剧墖璺緞锛?- 宸ュ叿缁撴灉鍥剧墖鏀寔鐐瑰嚮棰勮锛?- 娴忚鍣ㄨ兘鎻愪緵 `File` 瀵硅薄鏃讹紝鏀寔 `Ctrl+V` 绮樿创鏂囦欢锛?- 绮樿创鏂囦欢鍚庤緭鍏ユ淇濇寔骞插噣锛岃矾寰勪綔涓哄唴閮ㄩ檮浠朵俊鎭紶缁?Agent锛?- 鑷姩涓虹矘璐存枃浠剁敓鎴愬敮涓€鏂囦欢鍚嶏紝閬垮厤鍚屽悕鏂版枃浠惰璇绘棫鏂囦欢锛?- 淇濈暀鍘熷鏂囦欢鎵╁睍鍚嶅拰鍐呭锛?- 鑱婂ぉ缂╃暐鍥炬渶澶х害 480脳360锛岀偣鍑诲悗鍙煡鐪嬪師鍥撅紱
- 宸ュ叿缁撴灉鍐呭祵鍥剧墖闄愬埗涓?4 MiB锛?- 涓嶄笂浼犲埌浜戠锛屾枃浠朵繚瀛樺湪杩愯 Pi Web 鐨勬湰鏈哄綋鍓嶉」鐩洰褰曪紱
- 鐩存帴绮樿创鏂囨湰璺緞鏃朵笉澶嶅埗鏂囦欢锛屼粛鐒舵敮鎸佸師璺緞浼犻€掋€?
### 瀹夎

#### 瀹夎 Pi 鎵╁睍

澶嶅埗锛?
```text
extensions/image-tool-results.ts
```

鍒帮細

```text
<PI_CODING_AGENT_DIR>/extensions/
```

鐒跺悗鍦?Pi 涓墽琛岋細

```text
/reload
```

鎴栭噸鍚?Pi Runtime銆?
#### 搴旂敤 Pi Web 琛ヤ竵

鍑嗗涓€涓?Pi Web 鐨勬湰鍦?Git 婧愮爜鐩綍锛岀劧鍚庢墽琛岋細

```powershell
.\scripts\apply-piweb-patch.ps1 `
  -SourceDir 'C:\path\to\pi-web-source' `
  -InstallDependencies
```

涔嬪悗浠庢墦杩囪ˉ涓佺殑婧愮爜鐩綍鍚姩 Pi Web銆傛湰琛ヤ竵闈㈠悜 Pi Web 0.9.x锛涗笂娓告簮鐮佸彂鐢熷彉鍖栧悗鍙兘闇€瑕侀噸鏂伴€傞厤銆?
### 绮樿创琛屼负

- 绮樿创 `E:\models\scene.zip` 杩欑被鏂囨湰璺緞锛氫笉浼氫笂浼犳枃浠讹紝鍙鏌?鏄剧ず璺緞骞朵綔涓烘枃鏈紶缁?Agent锛?- 绮樿创鐪熷疄鍓创鏉挎枃浠讹細涓婁紶鍒版湰鏈哄綋鍓嶉」鐩紝骞剁敓鎴愮被浼?`scene__paste_20260925_ab12c.zip` 鐨勫敮涓€鏂囦欢鍚嶏紱
- Agent 鏀跺埌鏂拌矾寰勫悗锛屽彲浠ヤ娇鐢?Pi 宸ュ叿璇诲彇鎴栧鐞嗭紱
- 鏂囦欢鍐呭涓嶄細鑷姩濉炲叆妯″瀷涓婁笅鏂囷紝鍙湁 Agent 涓诲姩璇诲彇鏃舵墠浼氳繘鍏ヤ笂涓嬫枃銆?
### 瀹夊叏璇存槑

寤鸿璁?Pi Web 鍙洃鍚?`127.0.0.1`銆傝ˉ涓佹部鐢?Pi Web 鐜版湁鐨勫厑璁哥洰褰曞拰涓婁紶瀹夊叏妫€鏌ャ€備笉瑕佹妸鏂囦欢 API 鏆撮湶鍒板叕缃戙€傝В鍘嬫垨鎵ц绮樿创鐨勫帇缂╁寘銆佽剼鏈墠蹇呴』鍏堟鏌ュ唴瀹广€?
鏈」鐩槸鐙珛鐨?Pi/Pi Web 闆嗘垚椤圭洰锛屼笉鏄?Pi 鎴?Pi Web 瀹樻柟鍙戝竷鐗堟湰銆?
## License

MIT License. See [LICENSE](LICENSE).

