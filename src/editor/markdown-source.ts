import {unified} from 'unified';
import remarkParse from 'remark-parse';
import {safeUrl} from '../design-system/schema';
const parser=unified().use(remarkParse);
const escape=(text:string)=>text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
type SourceNode={type:string;depth?:number;position?:{start:{offset?:number};end:{offset?:number}};children?:SourceNode[]};
export function highlightMarkdown(source:string,images=false){
 const root=parser.parse(source) as SourceNode;let imageIndex=0;
 function render(node:SourceNode,start:number,end:number):string{
  let offset=start,html='';
  for(const child of node.children||[]){const a=child.position?.start.offset,b=child.position?.end.offset;if(a===undefined||b===undefined)continue;html+=escape(source.slice(offset,a));html+=render(child,a,b);offset=b}
  html+=escape(source.slice(offset,end));
  if(node.type==='image'&&images){const image=node as SourceNode&{url?:string;alt?:string};const i=imageIndex++;if(image.url&&safeUrl.safeParse(image.url).success)return `<span class="md-image-source">${html}</span><img class="md-image-preview" data-md-image="${i}" contenteditable="false" tabindex="0" role="button" aria-label="Modifier la photo de l’article" src="${escape(image.url)}" alt="${escape(image.alt||'')}"/>`}
  const style:Record<string,string>={strong:'md-strong',emphasis:'md-em',inlineCode:'md-code',code:'md-code',link:'md-link',heading:'md-heading',blockquote:'md-quote'};
  return style[node.type]?`<span class="${style[node.type]}${node.type==='heading'?' md-heading-'+Math.min((node.depth||1)+1,6):''}">${html}</span>`:html;
 }
 return render(root,0,source.length);
}
export function markdownImages(source:string){
 const result:{start:number;end:number;url:string;alt:string}[]=[];
 function visit(node:SourceNode&{url?:string;alt?:string}){if(node.type==='image'&&node.position?.start.offset!==undefined&&node.position.end.offset!==undefined)result.push({start:node.position.start.offset,end:node.position.end.offset,url:node.url||'',alt:node.alt||''});for(const child of node.children||[])visit(child)}
 visit(parser.parse(source) as SourceNode);return result;
}
export function replaceMarkdownImage(source:string,index:number,changes:{url?:string;alt?:string}){const image=markdownImages(source)[index];if(!image)return source;const url=changes.url??image.url,alt=(changes.alt??image.alt).replace(/\n/g,' ').replace(/[\\\[\]]/g,'\\$&');const destination=url.replace(/\s/g,c=>encodeURIComponent(c)).replace(/\(/g,'%28').replace(/\)/g,'%29');return source.slice(0,image.start)+`![${alt}](${destination})`+source.slice(image.end)}
