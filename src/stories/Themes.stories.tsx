import {PageFrame,PageContent} from '../design-system/components';
import {pageSchema} from '../design-system/schema';
import raw from '../../examples/blank/content/home.json';
const data=pageSchema.parse(raw);
export default {title:'Themes/Blank website'};
export const Neutral={render:()=> <PageFrame {...data.root.props} designTheme="neutral"><PageContent data={data}/></PageFrame>};
export const Paper90={render:()=> <PageFrame {...data.root.props} designTheme="paper90"><PageContent data={data}/></PageFrame>};
