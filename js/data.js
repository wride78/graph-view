export async function load(url){
 const t=await fetch(url).then(r=>r.text());
 return t.split("\n").slice(1).map(r=>r.split(","));
}
