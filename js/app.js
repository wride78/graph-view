import {URL0,URL1} from './config.js';
import {load} from './data.js';

const MAIN_COLOR_MAP={
 "1":0x2f855a,"2":0x6b46c1,"3":0xb91c1c,"4":0x0369a1,"5":0xea580c
};

(async()=>{
 const main=await load(URL0);
 const nodes=await load(URL1);

 const app=new PIXI.Application({resizeTo:window});
 document.getElementById("graph").appendChild(app.view);

 const g=new PIXI.Graphics();
 app.stage.addChild(g);

 const sim=d3.forceSimulation()
  .force("center",d3.forceCenter(window.innerWidth/2,window.innerHeight/2))
  .force("charge",d3.forceManyBody().strength(-200));

 const all=[];
 main.forEach(r=>{
  all.push({id:r[0],label:r[1],isMain:true});
 });
 nodes.forEach(r=>{
  all.push({id:r[0],label:r[1],links:r[2],main:r[3]});
 });

 sim.nodes(all);

 app.ticker.add(()=>{
  g.clear();
  all.forEach(n=>{
    const color=n.isMain?MAIN_COLOR_MAP[n.id]||0xffffff:0x3b82f6;
    g.beginFill(color);
    g.drawCircle(n.x,n.y,n.isMain?20:10);
    g.endFill();
  });
 });

})();
