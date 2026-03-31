export function createGraph(app,nodes,links,colorMap,onSelect){

 const g=new PIXI.Graphics();
 app.stage.addChild(g);

 const sim=d3.forceSimulation(nodes)
  .force("link",d3.forceLink(links).id(d=>d.id).distance(140))
  .force("charge",d3.forceManyBody().strength(-350))
  .force("center",d3.forceCenter(window.innerWidth/2,window.innerHeight/2))
  .force("collision",d3.forceCollide().radius(d=>d.isMain?30:18));

 app.ticker.add(()=>{
  g.clear();

  // edges
  g.lineStyle(2,0xffffff,0.7);
  links.forEach(l=>{
    if(l.source.x&&l.target.x){
      g.moveTo(l.source.x,l.source.y);
      g.lineTo(l.target.x,l.target.y);
    }
  });

  // nodes
  nodes.forEach(n=>{
    const color=n.isMain?colorMap[n.id]||0xffffff:0x3b82f6;
    g.beginFill(color);
    g.drawCircle(n.x||0,n.y||0,n.isMain?20:10);
    g.endFill();
  });
 });

 app.view.addEventListener("click",e=>{
  const rect=app.view.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;
  let found=null;
  nodes.forEach(n=>{
    if(n.x&&Math.hypot(n.x-x,n.y-y)<20)found=n;
  });
  onSelect(found);
 });

 return sim;
}
