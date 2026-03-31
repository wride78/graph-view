export function createGraph(app,nodes,links,colorMap){

 const g=new PIXI.Graphics();
 app.stage.addChild(g);

 const sim=d3.forceSimulation(nodes)
  .force("link",d3.forceLink(links).id(d=>d.id).distance(120))
  .force("charge",d3.forceManyBody().strength(-300))
  .force("center",d3.forceCenter(window.innerWidth/2,window.innerHeight/2))
  .force("collision",d3.forceCollide().radius(d=>d.isMain?30:18));

 app.ticker.add(()=>{
  g.clear();

  // edges
  g.lineStyle(2,0xffffff,0.6);
  links.forEach(l=>{
    g.moveTo(l.source.x,l.source.y);
    g.lineTo(l.target.x,l.target.y);
  });

  // nodes
  nodes.forEach(n=>{
    const color=n.isMain?colorMap[n.id]||0xffffff:0x3b82f6;
    g.beginFill(color);
    g.drawCircle(n.x,n.y,n.isMain?20:10);
    g.endFill();
  });

 });

 return sim;
}
