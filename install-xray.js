const { createHash } = require('node:crypto');
const { mkdirSync, writeFileSync, chmodSync } = require('node:fs');
const AdmZip = require('adm-zip');

// Pin the official release and checksums for reproducible builds.
const releases = {
  x64: ['Xray-linux-64.zip', 'b651f7e1d9966ee2c1b1ee1bf8b52c72771824d3065dce96bbc8bcc19ed95f82'],
  arm64: ['Xray-linux-arm64-v8a.zip', '64ed6858982a7f5eb85d88b811089063bd4f17561f4c8f44e0f1dc8e6f6430be'],
};
async function main() {
  if (process.platform !== 'linux' || !releases[process.arch]) throw new Error(`Unsupported platform: ${process.platform}/${process.arch}`);
  const [asset, expected] = releases[process.arch];
  const response = await fetch(`https://github.com/XTLS/Xray-core/releases/download/v26.11.9/${asset}`);
  if (!response.ok) throw new Error(`Xray download failed: HTTP ${response.status}`);
  const archive = Buffer.from(await response.arrayBuffer());
  if (createHash('sha256').update(archive).digest('hex') !== expected) throw new Error('Xray archive checksum mismatch');
  const binary = new AdmZip(archive).getEntry('xray');
  if (!binary) throw new Error('Xray binary missing from archive');
  mkdirSync('.xray', { recursive: true });
  writeFileSync('.xray/xray', binary.getData());
  chmodSync('.xray/xray', 0o755);
  console.log(`Installed Xray v26.11.9 for ${process.arch}`);
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
