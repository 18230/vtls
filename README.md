# xray-northflank

基于官方 `XTLS/Xray-core` 镜像的 Northflank 部署模板，协议为 `VLESS + WebSocket`。Northflank 负责外层 HTTPS/TLS，容器内 Xray 只监听普通 WebSocket。

## 环境变量

在 Northflank 服务中配置：

```text
PORT=8080
UUID=replace-with-your-uuid
WS_PATH=/vless
```

UUID 建议只放在 Northflank 环境变量中：

```text
使用部署时提供的 UUID，不要把真实 UUID 提交到公开仓库。
```

## Northflank 配置

1. 创建 Service，选择从 GitHub 仓库部署。
2. Build 类型选择 Dockerfile。
3. Public port 设置为 `8080`，协议选择 HTTP/WebSocket。
4. 添加上面的环境变量。
5. 部署完成后记录 Northflank 给出的公网域名。

## Clash/Mihomo

部署完成后，把 `clash-template.yaml` 里的两处占位符替换掉：

- `YOUR_NORTHFLANK_DOMAIN` 替换为 Northflank 公网域名。
- `YOUR_UUID` 替换为你在 Northflank 环境变量中设置的 UUID。

客户端仍然使用 `port: 443` 和 `tls: true`，因为 TLS 在 Northflank 边缘处理。
