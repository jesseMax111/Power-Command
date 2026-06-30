const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const nativeOnlyPackages = ["react-native-maps"];

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && nativeOnlyPackages.some((pkg) => moduleName === pkg || moduleName.startsWith(pkg + "/"))) {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "stubs/react-native-maps.js"),
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
