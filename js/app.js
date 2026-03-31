import {URL_MAIN,URL_NODE,MAIN_COLOR_MAP} from "./config.js";
import {load} from "./data.js";
import {createGraph} from "./graph.js";
import {show} from "./ui.js";

(async()=>{
 const main=await load(URL_MAIN);
 const node=await load(URL_NODE);

 const nodes=[];
 const links=[];

 main.forEach(r=>{
  if(!r[0])return;
  nodes.push({id:r[0].trim(),label:r[1],isMain:true});
 });

 node.forEach(r=>{
  if(!r[0])return;
  nodes.push({id:r[0].trim(),label:r[1],links:r[2],main:r[3],isMain:false});
 });

 nodes.forEach(n=>{
  if(n.links){
    n.links.split(",").forEach(t=>{
      if(t.trim())links.push({source:n.id,target:t.trim()});
    });
  }
  if(n.main){
    n.main.split(",").forEach(m=>{
      if(m.trim())links.push({source:n.id,target:m.trim()});
    });
  }
 });

 const app=new PIXI.Application({resizeTo:window});
 document.getElementById("graph").appendChild(app.view);

 createGraph(app,nodes,links,MAIN_COLOR_MAP,show);

})();
