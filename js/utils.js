export function parseCSV(text){
 const rows=[];let row=[],field="",inQuotes=false;
 for(let i=0;i<text.length;i++){
  const ch=text[i],next=text[i+1];
  if(ch=='"'){
    if(inQuotes&&next=='"'){field+='"';i++;}
    else inQuotes=!inQuotes;
  }else if(ch==','&&!inQuotes){
    row.push(field);field="";
  }else if((ch=='\n'||ch=='\r')&&!inQuotes){
    if(ch=='\r'&&next=='\n')i++;
    row.push(field);rows.push(row);row=[];field="";
  }else field+=ch;
 }
 return rows.slice(1);
}
