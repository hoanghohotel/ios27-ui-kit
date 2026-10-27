import data from './catalogue.json';
export type ThemeMode = 'light' | 'dark';
export interface CatalogueEntry { id:string; page:string; group:string; name:string; properties:Record<string,string>; width:number; height:number; file:string; warnings:string[]; textCount:number }
export const catalogue = data as CatalogueEntry[];
export function findVariant(group:string, properties:Record<string,string|boolean> = {}, page?:string):CatalogueEntry {
  const candidates=catalogue.filter(c=>c.group===group && (!page || c.page===page));
  const found=candidates.find(c=>Object.entries(properties).every(([k,v])=>c.properties[k]===String(typeof v==='boolean'?(v?'True':'False'):v)));
  if (!found) throw new Error(`Unknown variant: ${page ?? ''}/${group} ${JSON.stringify(properties)}`);
  return found;
}
export interface TextLayer {key:string;id:string;name:string;text:string;x:number;y:number;width:number;height:number;fontSize:number;fontFamily:string;fontWeight:number;lineHeight:number;color:string;opacity:number;align:string;matrix:number[]}
export interface HitArea {id:string;name:string;x:number;y:number;width:number;height:number}
export interface Scene {svg:string;texts:TextLayer[];hits:HitArea[];assets:string[];warnings:string[]}
export interface ComponentData extends CatalogueEntry {light:Scene;dark:Scene}
