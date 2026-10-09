---
title: vtls
sdk: docker
app_port: 8080
pinned: false
---

# vtls

基于官方 `XTLS/Xray-core` 镜像的 Docker 部署模板，协议为 `VLESS + WebSocket`。平台负责外层 HTTPS/TLS，容器内 Xray 只监听普通 WebSocket。

## 环境变量

在部署平台中配置：

```text
PORT=8080
UUID=replace-with-your-uuid
WS_PATH=/vless
XRAY_PORT=10000
```

UUID 建议只放在平台 Secret/环境变量中：

```text
使用部署时提供的 UUID，不要把真实 UUID 提交到公开仓库。
```

## Hugging Face Spaces 配置

1. 创建 Space，SDK 选择 Docker。
2. Visibility 可选择 Public，Hardware 选择 CPU basic。
3. 在 Space 的 Settings 中添加 Secret/Variable：`UUID`、`WS_PATH=/vless`、`PORT=8080`、`XRAY_PORT=10000`。
4. 部署完成后访问 `/health`，返回 `ok` 表示容器入口正常。

## Render 配置

1. 创建 Web Service，选择从 GitHub 仓库部署，服务名使用 `vtls-18230`。
2. Runtime 选择 Docker，Dockerfile 路径使用 `./Dockerfile`。
3. Plan 选择 Free 或其它需要的实例类型。
4. Health Check Path 设置为 `/`。
5. 添加上面的环境变量。
6. 部署完成后记录 Render 给出的 `.onrender.com` 公网域名。

## Clash/Mihomo

部署完成后，把 `clash-template.yaml` 里的两处占位符替换掉：

- `YOUR_RENDER_DOMAIN` 替换为平台公网域名。
- `YOUR_UUID` 替换为你在平台 Secret/环境变量中设置的 UUID。

客户端仍然使用 `port: 443` 和 `tls: true`，因为 TLS 在平台边缘处理。

## 演示记录

- 2026-10-09：Muse 拉取修改流程演示。本行由 Muse 在分支 `demo/muse-flow-demo` 上提交，演示用，可直接丢弃。
