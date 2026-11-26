import { z } from 'zod';
export const tones = ['paper', 'blue', 'salmon', 'yellow', 'indigo', 'orange'] as const;
export const layouts = ['centered', 'split', 'reverse'] as const;
export const spaces = ['compact', 'normal', 'airy'] as const;
export const safeUrl = z.string().max(2048).refine(v => !v || /^(\/(?!\/)|#|https:\/\/|mailto:)/i.test(v), 'Use a local path, https URL, anchor or email.');
export const actionSchema=z.object({label:z.string().trim().min(1).max(80),href:safeUrl.refine(v=>v.length>0,'Add a destination'),variant:z.enum(['solid','link']).default('solid')});
export const mediaKinds = ['none','scribble','discs','image'] as const;
export const mediaSchema = z.enum(mediaKinds);
export const illustrationSchema = z.object({media:mediaSchema.default('none'),image:safeUrl.default(''),alt:z.string().default('')});
export const commonSchema = z.object({
  ...illustrationSchema.shape,
  tone: z.enum(tones).default('paper'), layout: z.enum(layouts).default('centered'),
  space: z.enum(spaces).default('airy'), width: z.enum(['reading','wide']).default('wide'),
  actions:z.array(actionSchema).max(2).default([]),
  anchor: z.string().regex(/^[a-zA-Z][\w-]*$|^$/).default(''),
});
export const itemSchema = z.object({title:z.string(), body:z.string(), image:safeUrl.default(''), alt:z.string().default(''), href:safeUrl.default(''),media:mediaSchema.default('image')});
export const sectionSchema = commonSchema.extend({label:z.string(),title:z.string(),body:z.string(),...illustrationSchema.shape});
export const articleSchema=commonSchema.extend({label:z.string(),title:z.string(),body:z.string()});
export const heroSchema = commonSchema.extend({media:mediaSchema.default('discs'),title:z.string(),subtitle:z.string()});
export const photoSchema = commonSchema.extend({media:mediaSchema.default('image'),caption:z.string()});
export const cardsSchema = commonSchema.extend({label:z.string(),title:z.string(),items:z.array(itemSchema).max(12)});
export const linksSchema = commonSchema.extend({media:mediaSchema.default('scribble'),label:z.string(),title:z.string(),items:z.array(z.object({title:z.string(),href:safeUrl})).max(20)});
export const rootSchema = z.object({designTheme:z.enum(['neutral','paper90']).default('neutral'),siteName:z.string().min(1).default('Your site'),title:z.string().min(1),description:z.string(),location:z.string(),theme:z.enum(['light','dark','auto']),draft:z.boolean(),navigation:z.array(z.object({title:z.string(),href:safeUrl})).max(12).default([{title:'Work',href:'/#work'},{title:'Elsewhere',href:'/#contact'}])});
export const pageSchema = z.object({root:z.object({props:rootSchema}),content:z.array(z.discriminatedUnion('type',[
  z.object({type:z.literal('Article'),props:articleSchema.extend({id:z.string().min(1)})}),z.object({type:z.literal('Hero'),props:heroSchema.extend({id:z.string().min(1)})}),z.object({type:z.literal('Section'),props:sectionSchema.extend({id:z.string().min(1)})}),z.object({type:z.literal('Photo'),props:photoSchema.extend({id:z.string().min(1)})}),z.object({type:z.literal('Cards'),props:cardsSchema.extend({id:z.string().min(1)})}),z.object({type:z.literal('Links'),props:linksSchema.extend({id:z.string().min(1)})}),
])).max(100)}).superRefine((page,ctx)=>{
 const ids=new Set<string>(), anchors=new Set<string>();
 for(const section of page.content){
  if(ids.has(section.props.id)) ctx.addIssue({code:'custom',message:'Duplicate section ID'});
  ids.add(section.props.id);
  if(section.props.anchor && anchors.has(section.props.anchor)) ctx.addIssue({code:'custom',message:'Duplicate anchor'});
  if(section.props.anchor) anchors.add(section.props.anchor);
 }
 if(page.content.filter(s=>s.type==='Hero').length!==1) ctx.addIssue({code:'custom',message:'Keep exactly one Hero (the page title).'});
});
export type CommonProps=z.infer<typeof commonSchema>;
export type SectionProps=z.infer<typeof sectionSchema>;
export type HeroProps=z.infer<typeof heroSchema>;
export type PhotoProps=z.infer<typeof photoSchema>;
export type CardsProps=z.infer<typeof cardsSchema>;
export type LinksProps=z.infer<typeof linksSchema>;
export type PageData=z.infer<typeof pageSchema>;
export const commonDefaults:CommonProps={media:'none',image:'',alt:'',tone:'paper',layout:'centered',space:'airy',width:'wide',anchor:'',actions:[]};

export type ArticleProps=z.infer<typeof articleSchema>;
