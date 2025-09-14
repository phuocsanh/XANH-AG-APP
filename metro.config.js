const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Cấu hình để hỗ trợ web platform và giải quyết lỗi import.meta
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Thêm cấu hình transformer để xử lý import.meta và ESM modules
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
  // Hỗ trợ import.meta cho web platform
  unstable_importMeta: true,
};

module.exports = config;