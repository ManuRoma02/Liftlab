import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.liftlab.app',
  appName: 'LiftLab',
  webDir: 'dist',
  backgroundColor: '#090A0B',
  android: {
    backgroundColor: '#090A0B'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#090A0B',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    CapacitorUpdater: {
      autoUpdate: false,
      appReadyTimeout: 10000,
      responseTimeout: 30,
      autoDeleteFailed: true,
      autoDeletePrevious: true,
      resetWhenUpdate: true,
    },
  },
};

export default config;
