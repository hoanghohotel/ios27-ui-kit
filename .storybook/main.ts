import type {StorybookConfig} from '@storybook/react-vite';
const config: StorybookConfig = {
  stories: ['../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  staticDirs: [{from: '../apps/showcase/public/ios27', to: '/ios27'}],
  core: {disableTelemetry: true},
};
export default config;
