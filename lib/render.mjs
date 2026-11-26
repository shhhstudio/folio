import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {PageFrame,PageContent} from '../dist/index.mjs';
import {parsePage} from './store.mjs';
import {packageRoot} from './config.mjs';
export async function themeCSS(){
 const files=['src/design-system/tokens.css','src/design-system/styles.css','themes/neutral.css'];
 return (await Promise.all(files.map(f=>readFile(path.join(packageRoot,f),'utf8')))).join('\n').replace("@import './tokens.css';",'');
}
export async function renderPage(input,config,pathname='/'){
 const data=parsePage(config,input),meta=data.root.props;
 const node=React.createElement;
 const canonical=new URL(pathname,config.url).href;
 const tags=[node('meta',{charSet:'utf-8',key:'charset'}),node('meta',{name:'viewport',content:'width=device-width, initial-scale=1',key:'viewport'}),node('title',{key:'title'},meta.title),node('meta',{name:'description',content:meta.description,key:'description'}),node('link',{rel:'canonical',href:canonical,key:'canonical'}),node('meta',{property:'og:title',content:meta.title,key:'og-title'}),node('meta',{property:'og:description',content:meta.description,key:'og-description'}),node('meta',{property:'og:url',content:canonical,key:'og-url'}),node('meta',{property:'og:type',content:'website',key:'og-type'}),node('link',{rel:'icon',href:config.favicon,key:'favicon'}),node('style',{key:'style'},'html,body{margin:0}'+await themeCSS())];
 if(meta.draft)tags.push(node('meta',{name:'robots',content:'noindex',key:'robots'}));
 if(config.socialImage)tags.push(node('meta',{property:'og:image',content:new URL(config.socialImage,config.url).href,key:'og-image'}));
 return '<!doctype html>'+renderToStaticMarkup(node('html',{lang:'en'},node('head',null,...tags),node('body',null,node(PageFrame,{...meta},node(PageContent,{data})))));
}
