let handler=()=>null;
export function setServiceHandler(next){handler=next;}
export async function simulate(name,args){
 const result=handler(name,args);
 if(result!==undefined) return result;
 if(name.startsWith('get')) return [];
 return {success:true,id:'simulation',loaded:0};
}
