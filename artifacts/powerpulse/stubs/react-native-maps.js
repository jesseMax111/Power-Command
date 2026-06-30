// Stub for react-native-maps on web — maps are not supported in the browser.
const React = require("react");
const { View } = require("react-native");

const Noop = () => null;

module.exports = {
  default: Noop,
  MapView: Noop,
  Marker: Noop,
  Callout: Noop,
  Polygon: Noop,
  Polyline: Noop,
  Circle: Noop,
  Overlay: Noop,
  UrlTile: Noop,
  PROVIDER_GOOGLE: "google",
  PROVIDER_DEFAULT: null,
};
