// CADI Integridade — Cloudflare Worker (não implantado automaticamente).
// Requer: RESEND_API_KEY (secret), TURNSTILE_SECRET (secret), MAIL_FROM (domínio verificado).
const ALLOWED_ORIGINS=new Set(["https://diagnostico.valuii.com.br","https://valuiibr.github.io"]);
const DESTINATION="contato@valuii.com.br";
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function response(body,status,origin){return new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","Access-Control-Allow-Origin":origin,"Vary":"Origin","Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS"}});}
function clean(s,max=150){return String(s??"").trim().slice(0,max);}
export default {
 async fetch(request,env){
   const origin=request.headers.get("Origin")||"";
   if(!ALLOWED_ORIGINS.has(origin))return new Response("Forbidden",{status:403});
   if(request.method==="OPTIONS")return new Response(null,{status:204,headers:{"Access-Control-Allow-Origin":origin,"Access-Control-Allow-Headers":"Content-Type","Access-Control-Allow-Methods":"POST, OPTIONS","Vary":"Origin"}});
   if(request.method!=="POST")return response({error:"Method not allowed"},405,origin);
   if(!env.RESEND_API_KEY||!env.TURNSTILE_SECRET||!env.MAIL_FROM)return response({error:"Integração indisponível"},503,origin);
   const contentType=request.headers.get("content-type")||"";
   if(!contentType.includes("application/json"))return response({error:"Tipo de conteúdo inválido"},415,origin);
   const length=Number(request.headers.get("content-length")||0);
   if(length>6500000)return response({error:"Arquivo acima do limite"},413,origin);
   let body;try{body=await request.json()}catch{return response({error:"JSON inválido"},400,origin);}
   if(body?.simulacao||!body?.identificacao?.authorized)return response({error:"Avaliação não autorizada ou simulação"},400,origin);
   if(typeof body?.turnstileToken!=="string"||!body.turnstileToken)return response({error:"Validação de segurança ausente"},400,origin);
   const b64=body.pdfBase64;
   if(typeof b64!=="string"||b64.length<100||b64.length>6000000||!/^[A-Za-z0-9+/=\r\n]+$/.test(b64))return response({error:"PDF inválido"},400,origin);
   const meta=body.identificacao||{}, summary=body.resumo||{};
   const unit=clean(meta.org,150),person=clean(meta.respondent,120),email=clean(meta.email,140);
   if(!unit||!person||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return response({error:"Identificação incompleta"},400,origin);
   const verifyForm=new FormData();verifyForm.set("secret",env.TURNSTILE_SECRET);verifyForm.set("response",body.turnstileToken);verifyForm.set("remoteip",request.headers.get("CF-Connecting-IP")||"");
   let verified=false;
   try{const verify=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",body:verifyForm});const data=await verify.json();verified=Boolean(data.success)&&(!data.hostname||["diagnostico.valuii.com.br","valuiibr.github.io"].includes(data.hostname));}catch{}
   if(!verified)return response({error:"Verificação antirrobô não validada"},403,origin);
   const dims=(Array.isArray(summary.dimensoes)?summary.dimensoes:[]).slice(0,12).map(d=>"<tr><td style='padding:5px 10px;border:1px solid #e1e9ee'>"+escapeHtml(clean(d.name,120))+"</td><td style='padding:5px 10px;border:1px solid #e1e9ee'>"+(Number.isFinite(Number(d.score))?Math.round(Number(d.score))+"%":"N/A")+"</td></tr>").join("");
   const reportHtml="<div style='font-family:Arial,sans-serif;color:#132e40'><h2>CADI Integridade — Relatório de autoavaliação</h2><p><b>Unidade:</b> "+escapeHtml(unit)+"</p><p><b>Responsável:</b> "+escapeHtml(person)+"</p><p><b>E-mail:</b> "+escapeHtml(email)+"</p><p><b>Índice preliminar:</b> "+(Number.isFinite(Number(summary.indice))?Math.round(Number(summary.indice))+"%":"Indeterminado")+"</p><table style='border-collapse:collapse'>"+dims+"</table><p>PDF detalhado anexo. Autoavaliação declaratória, não constitui auditoria, certificação ou verificação definitiva de conformidade.</p></div>";
   const sent=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+env.RESEND_API_KEY,"Content-Type":"application/json"},body:JSON.stringify({from:env.MAIL_FROM,to:[DESTINATION],subject:"CADI Integridade | "+unit,html:reportHtml,reply_to:email,attachments:[{filename:"CADI_Integridade_Relatorio.pdf",content:b64}]})});
   if(!sent.ok){return response({error:"Serviço de e-mail não confirmou o recebimento"},502,origin);}
   return response({ok:true,message:"Recebido pelo servidor de envio"},200,origin);
 }
};