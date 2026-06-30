---
name: Maps native-only pattern
description: How to use react-native-maps in an Expo project without breaking the web bundler
---

Split the map screen into two files:
- `map.native.tsx` — imports and uses react-native-maps normally
- `map.tsx` — web fallback that renders a placeholder without any maps import

Also add a Metro resolver stub so any stray import of react-native-maps on web resolves to a no-op stub file:

```js
// metro.config.js
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return { type: "sourceFile", filePath: path.resolve(__dirname, "stubs/react-native-maps.js") };
  }
  ...
};
```

**Why:** Metro's web bundler statically follows all imports including those inside runtime `if (Platform.OS !== 'web')` guards and those in `.native.tsx` files discovered via expo-router's `require.context`. Without the stub, the web build fails with "Importing react-native internals is not supported on web."

**How to apply:** Any time react-native-maps (or another native-only package) is needed, use both the platform file split AND the Metro stub.
