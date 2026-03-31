function parseCSV(text){
  const rows=[]; let row=[],field="",inQuotes=false;
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

export async function load(url){
  const res=await fetch(url);
  const buf=await res.arrayBuffer();

  let text=new TextDecoder("utf-8").decode(buf);
  if(text.includes("ì")||text.includes("�")){
    try{
      text=new TextDecoder("euc-kr").decode(buf);
    }catch(e){}
  }

  text=text.replace(/^\uFEFF/,"");
  return parseCSV(text);
}
