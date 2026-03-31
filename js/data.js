import {parseCSV} from "./utils.js";

export async function loadData(url){
 const res=await fetch(url);
 const txt=await res.text();
 return parseCSV(txt);
}
