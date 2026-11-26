import type {Meta,StoryObj} from '@storybook/react-vite';
import {Section,Hero,Photo,Cards,Links,Article} from '../design-system/components';
import {sectionDefaults,heroDefaults,photoDefaults,cardsDefaults,linksDefaults,articleDefaults} from '../design-system/presets';
const meta={title:'Sections/Compose',component:Section,tags:['autodocs'],args:sectionDefaults,argTypes:{tone:{control:'select',options:['paper','blue','salmon','yellow','indigo','orange']},media:{control:'select',options:['none','scribble','discs','image']},layout:{control:'select',options:['centered','split','reverse']}}} satisfies Meta<typeof Section>;
export default meta;type Story=StoryObj<typeof meta>;
export const TextAndShape:Story={};
export const Photograph:Story={args:{media:'image',image:'/media/example.svg',alt:'An abstract landscape',layout:'split'}};
export const JustText:Story={args:{media:'none'}};
export const EverySection={render:()=><><Hero {...heroDefaults}/><Section {...sectionDefaults}/><Photo {...photoDefaults}/><Cards {...cardsDefaults}/><Links {...linksDefaults}/><Article {...articleDefaults}/></>};
