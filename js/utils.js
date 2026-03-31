export function parseCSV(text){
 return text.trim().split("\n").map(r=>r.split(","));
}
