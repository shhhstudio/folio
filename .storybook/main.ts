import type {StorybookConfig} from '@storybook/react-vite';
const config:StorybookConfig={stories:['../src/stories/**/*.stories.tsx'],addons:['@storybook/addon-docs','@storybook/addon-a11y'],framework:{name:'@storybook/react-vite',options:{}},staticDirs:[{from:'../examples/blank/public',to:'/'},{from:'../assets',to:'/folio-assets'}],core:{disableTelemetry:true}};
export default config;
