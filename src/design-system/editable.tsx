import {InlineMarkdown} from './markdown';
import {createContext,useContext,type ReactNode} from 'react';
export type EditableProps={field:string;value:string;multiline?:boolean;images?:boolean;children?:ReactNode};
// Optional adapter. Public rendering and Storybook need no editing dependency.
export const EditingContext=createContext<((props:EditableProps)=>ReactNode)|null>(null);
export function Editable(props:EditableProps){const render=useContext(EditingContext);return render?<>{render(props)}</>:<>{props.children??<InlineMarkdown>{props.value}</InlineMarkdown>}</>}

export const PhotoEditingContext=createContext<((field:string)=>void)|null>(null);
export function EditablePhoto({field,children}:{field:string;children:ReactNode}){const edit=useContext(PhotoEditingContext);return edit?<div className="editable-photo" role="button" tabIndex={0} aria-label="Modifier la photo" onClick={e=>{e.stopPropagation();edit(field)}} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();edit(field)}}}>{children}</div>:<>{children}</>}

export function WhenEditingOrPresent({value,children}:{value:unknown;children:ReactNode}){const editing=useContext(EditingContext);return value||editing?<>{children}</>:null}
