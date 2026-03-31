export function show(node){
 const el=document.getElementById("panel");
 if(!node){el.innerHTML="";return;}
 el.innerHTML=`<b>${node.label}</b><br>ID:${node.id}`;
}
