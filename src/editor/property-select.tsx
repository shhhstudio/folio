import {useId} from 'react';
const names:Record<string,string>={neutral:'Neutral',paper90:'Paper90',paper:'Papier',blue:'Bleu',salmon:'Saumon',yellow:'Jaune',indigo:'Indigo · extra',orange:'Orange · extra',none:'None',discs:'Color shapes',scribble:'Line',image:'Photography',compact:'Compact',normal:'Normal',airy:'Aéré'};
const inks:Record<string,string>={paper:'#f6f1e7',blue:'#3d62a8',salmon:'#e1907d',yellow:'#e8bb4a',indigo:'#363752',orange:'#cd6a24'};
export function PropertySelect({label,value,values,onChange,color=false}:{label:string;value:string;values:string[];onChange:(value:string)=>void;color?:boolean}){
 const id=useId();return <div className="property-select"><label htmlFor={id}>{label}</label><div className={'select-shell '+(color?'has-swatch':'')}>{color&&<span className="select-ink" style={{background:inks[value]}}/>}<select id={id} value={value} onChange={e=>onChange(e.target.value)}>{values.map(v=><option key={v} value={v}>{names[v]||v}</option>)}</select><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m8 9 4 4 4-4"/></svg></div></div>
}
