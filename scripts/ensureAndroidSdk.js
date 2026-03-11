const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const androidDir = path.join(repoRoot, "android");
const localPropertiesPath = path.join(androidDir, "local.properties");

function detectSdkDir() {
  const envSdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT;
  if (envSdk && fs.existsSync(envSdk)) {
    return envSdk;
  }
  const commonWindowsPath = "C:\\Android\\Sdk";
  if (fs.existsSync(commonWindowsPath)) {
    return commonWindowsPath;
  }
  return "";
}

function toGradleSdkLine(sdkDir) {
  const escaped = sdkDir.replace(/\\/g, "\\\\");
  return `sdk.dir=${escaped}`;
}

if (!fs.existsSync(androidDir)) {
  console.error("Android directory does not exist. Run `expo prebuild --platform android` first.");
  process.exit(1);
}

const sdkDir = detectSdkDir();
if (!sdkDir) {
  console.error(
    "Android SDK not found. Set ANDROID_HOME or ANDROID_SDK_ROOT, or install SDK under C:\\Android\\Sdk."
  );
  process.exit(1);
}

const line = toGradleSdkLine(sdkDir);
let current = "";
if (fs.existsSync(localPropertiesPath)) {
  current = fs.readFileSync(localPropertiesPath, "utf8");
}

if (current.includes("sdk.dir=")) {
  const updated = current
    .split(/\r?\n/)
    .map((entry) => (entry.startsWith("sdk.dir=") ? line : entry))
    .join("\n");
  fs.writeFileSync(localPropertiesPath, `${updated.trim()}\n`, "utf8");
} else {
  const prefix = current.trim() ? `${current.trim()}\n` : "";
  fs.writeFileSync(localPropertiesPath, `${prefix}${line}\n`, "utf8");
}

console.log(`Android SDK configured in ${localPropertiesPath}`);
