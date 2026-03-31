export function showInfo(node){
 const el=document.getElementById("info");
 if(!node){el.innerHTML="";return;}
 el.innerHTML=`<b>${node.label}</b><br>${node.id}`;
}
