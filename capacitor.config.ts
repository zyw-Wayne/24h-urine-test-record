import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.urinetest.record',
  appName: '24小时尿蛋白检测记录',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
