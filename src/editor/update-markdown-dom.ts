// Patch text and formatting in place. In particular, typing below a photo must
// never detach that photo: even synchronous remove/reinsert can trigger anchoring.
export function updateMarkdownDOM(element:HTMLElement,html:string){
 const template=document.createElement('div');template.innerHTML=html;
 function compatible(current:Node,next:Node){
  if(current.nodeType!==next.nodeType||current.nodeName!==next.nodeName)return false;
  if(current instanceof HTMLImageElement&&next instanceof HTMLImageElement)return current.dataset.mdImage===next.dataset.mdImage;
  return true;
 }
 function patch(current:Node,next:Node){
  if(current.nodeType===Node.TEXT_NODE){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return}
  if(!(current instanceof Element)||!(next instanceof Element))return;
  // Keep a loaded image's intrinsic ratio reserved if its URL is later changed.
  if(current instanceof HTMLImageElement&&current.naturalWidth&&current.naturalHeight){current.width=current.naturalWidth;current.height=current.naturalHeight}
  for(const attribute of Array.from(current.attributes))if(!next.hasAttribute(attribute.name)&&!(current instanceof HTMLImageElement&&['width','height'].includes(attribute.name)))current.removeAttribute(attribute.name);
  for(const attribute of Array.from(next.attributes))if(current.getAttribute(attribute.name)!==attribute.value)current.setAttribute(attribute.name,attribute.value);
  children(current,next);
 }
 function children(current:Node,next:Node){
  let cursor=current.firstChild;
  for(const desired of Array.from(next.childNodes)){
   if(cursor&&compatible(cursor,desired)){const reused=cursor;cursor=cursor.nextSibling;patch(reused,desired);continue}
   // Find existing images/spans before inserting, so structural Markdown changes
   // also retain loaded image nodes wherever possible.
   let match=cursor?.nextSibling||null;while(match&&!compatible(match,desired))match=match.nextSibling;
   if(match){current.insertBefore(match,cursor);patch(match,desired)}else current.insertBefore(desired.cloneNode(true),cursor);
  }
  while(cursor){const following=cursor.nextSibling;current.removeChild(cursor);cursor=following}
 }
 children(element,template);
}
