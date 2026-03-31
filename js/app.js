import {URL_MAIN,URL_NODE} from './config.js';
import {load} from './data.js';

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

 const g=new PIXI.Graphics();
 app.stage.addChild(g);

 const sim=d3.forceSimulation(nodes)
  .force("link",d3.forceLink(links).id(d=>d.id).distance(120))
  .force("charge",d3.forceManyBody().strength(-300))
  .force("center",d3.forceCenter(window.innerWidth/2,window.innerHeight/2));

 app.ticker.add(()=>{
   g.clear();

   g.lineStyle(2,0xffffff,0.8);
   links.forEach(l=>{
     if(l.source.x&&l.target.x){
       g.moveTo(l.source.x,l.source.y);
       g.lineTo(l.target.x,l.target.y);
     }
   });

   nodes.forEach(n=>{
     g.beginFill(n.isMain?0x22c55e:0x3b82f6);
     g.drawCircle(n.x||0,n.y||0,n.isMain?18:10);
     g.endFill();
   });
 });

})();
