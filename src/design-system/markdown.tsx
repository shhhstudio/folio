import Markdown from 'react-markdown';
// Text labels never emit nested anchors or block elements inside headings/links.
export function InlineMarkdown({children}:{children:string}){return <Markdown allowedElements={['strong','em','code','br']} unwrapDisallowed>{children}</Markdown>}
