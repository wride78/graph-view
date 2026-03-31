import {URL_MAIN,URL_NODE,MAIN_COLOR_MAP} from "./config.js";
import {loadData} from "./data.js";
import {createGraph} from "./graph.js";
import {showInfo} from "./ui.js";

(async()=>{
 const main=await loadData(URL_MAIN);
 const nodesRaw=await loadData(URL_NODE);

 const nodes=[];
 const links=[];

 main.slice(1).forEach(r=>{
  nodes.push({id:r[0],label:r[1],isMain:true});
 });

 nodesRaw.slice(1).forEach(r=>{
  nodes.push({id:r[0],label:r[1],links:r[2],main:r[3]});
 });

 // build links
 nodes.forEach(n=>{
  if(n.links){
    n.links.split(",").forEach(t=>{
      links.push({source:n.id,target:t.trim()});
    });
  }
  if(n.main){
    n.main.split(",").forEach(m=>{
      links.push({source:n.id,target:m.trim()});
    });
  }
 });

 const app=new PIXI.Application({resizeTo:window});
 document.getElementById("graph").appendChild(app.view);

 createGraph(app,nodes,links,MAIN_COLOR_MAP);

 app.view.addEventListener("click",e=>{
  const x=e.clientX,y=e.clientY;
  let found=null;
  nodes.forEach(n=>{
    if(Math.hypot(n.x-x,n.y-y)<15) found=n;
  });
  showInfo(found);
 });

})();
