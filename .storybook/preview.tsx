import type {Preview} from '@storybook/react-vite';
import '../src/design-system/styles.css';
import '../themes/neutral.css';
const preview:Preview={parameters:{layout:'fullscreen',a11y:{test:'error'},controls:{expanded:true}},globalTypes:{theme:{toolbar:{icon:'circlehollow',items:['light','dark','auto']}},designTheme:{toolbar:{icon:'paintbrush',items:['neutral','paper90']}}},initialGlobals:{theme:'light',designTheme:'neutral'},decorators:[(Story,context)=>context.title.startsWith('Editor/')?<Story/>:<div className="paper" data-theme={context.globals.theme} data-design={context.globals.designTheme}><Story/></div>]};
export default preview;
