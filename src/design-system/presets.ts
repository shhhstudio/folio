import {commonDefaults} from './schema';
import type {SectionProps,HeroProps,PhotoProps,CardsProps,LinksProps} from './schema';
export const sectionDefaults:SectionProps={...commonDefaults,label:'Field notes',title:'Still curious.\nStill learning.',body:'A few notes on building things, changing your mind, and starting again.',media:'discs',image:'',alt:''};
export const heroDefaults:HeroProps={...commonDefaults,media:'discs',title:'Your site',subtitle:''};
export const photoDefaults:PhotoProps={...commonDefaults,media:'image',space:'compact',image:'/media/example.svg',alt:'An abstract landscape',caption:'A place to begin.'};
export const cardsDefaults:CardsProps={...commonDefaults,tone:'yellow',label:'Notebook · Sample content',title:'Things that stay with you.',items:[
 {title:'Leave room for the unexpected.',body:'A small experiment. A conversation. The part that wasn’t in the brief.',media:'image',image:'',alt:'',href:''},
 {title:'Start by listening.',body:'Before the first sketch or line of code, there’s usually a better question to ask.',media:'image',image:'',alt:'',href:''},
 {title:'Keep what works.',body:'New tools come and go. Care, clarity, and patience tend to stick around.',media:'image',image:'',alt:'',href:''}
]};
export const linksDefaults:LinksProps={...commonDefaults,media:'scribble',tone:'blue',label:'Friends',title:'Good people. Good work.',items:[{title:'Get in touch',href:'mailto:hello@example.com'}]};

export const articleDefaults={...commonDefaults,width:'reading' as const,layout:'split' as const,label:'Journal · Draft',title:'A few things worth keeping.',body:`An article can start with a simple paragraph. Write in **Markdown**, with as much room as you need.

## A little further along

A second paragraph, a different thought. Add a [link](https://example.com), a list, or a photograph along the way.

![A quiet road under a cloudy sky](/media/example.svg)

The story continues below the photograph. Click the image to change it.

- One idea at a time.
- Leave room for a conversation.

> A thought worth coming back to.

### What comes next

Keep writing. This is one continuous document, rather than a row of small cards.`};
