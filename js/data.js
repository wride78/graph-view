import {parseCSV} from "./utils.js";

export async function load(url){
 const res=await fetch(url);
 const buf=await res.arrayBuffer();

 let text=new TextDecoder("utf-8").decode(buf);
 if(text.includes("ì")||text.includes("�")){
   try{text=new TextDecoder("euc-kr").decode(buf);}catch(e){}
 }
 text=text.replace(/^\uFEFF/,"");
 return parseCSV(text);
}
