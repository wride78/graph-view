export function createGraph(app,nodes,links){

 const g=new PIXI.Graphics();
 app.stage.addChild(g);

 const linkForce=d3.forceLink(links)
   .id(d=>d.id)
   .distance(140);

 const sim=d3.forceSimulation(nodes)
  .force("link",linkForce)
  .force("charge",d3.forceManyBody().strength(-350))
  .force("center",d3.forceCenter(window.innerWidth/2,window.innerHeight/2))
  .force("collision",d3.forceCollide().radius(d=>d.isMain?30:18));

 linkForce.links(links);
 sim.alpha(1).restart();

 app.ticker.add(()=>{
  g.clear();

  g.lineStyle(2,0xffffff,0.7);
  links.forEach(l=>{
    if(l.source && l.target){
      g.moveTo(l.source.x||0,l.source.y||0);
      g.lineTo(l.target.x||0,l.target.y||0);
    }
  });

  nodes.forEach(n=>{
    g.beginFill(n.isMain?0x22c55e:0x3b82f6);
    g.drawCircle(n.x||0,n.y||0,n.isMain?20:10);
    g.endFill();
  });

 });

}
