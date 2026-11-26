export function pageAddress(value:string){return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^\/+|\/+$/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
