/* XAU Vision PRO v2
   Në index.html, para </body>, pas script-eve të tjera:  <script src="pro.js"></script>
   Dygjuhësh (SQ/EN, ndjek butonin e addon.js), me animacione dhe elemente interaktive. */
(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const f2=n=>isFinite(n)?n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}):'—';
const LS={get(k,d){try{const v=JSON.parse(localStorage.getItem(k));return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
const num=v=>{const n=parseFloat(v);return isFinite(n)?n:0};
const getLang=()=>{try{return localStorage.getItem('lang')==='en'?'en':'sq'}catch(e){return'sq'}};
let lang=getLang();const L=(a,e)=>lang==='en'?e:a;

/* ---------- matematika ---------- */
const avg=a=>a.reduce((x,y)=>x+y,0)/(a.length||1);
const ema=(a,n)=>{const k=2/(n+1);let e=a[0];return a.map((v,i)=>i?(e=v*k+e*(1-k)):e)};
const rsi=(c,n=14)=>{let g=0,l=0;for(let i=1;i<=n;i++){const d=c[i]-c[i-1];d>=0?g+=d:l-=d}g/=n;l/=n;for(let i=n+1;i<c.length;i++){const d=c[i]-c[i-1];g=(g*(n-1)+Math.max(d,0))/n;l=(l*(n-1)+Math.max(-d,0))/n}return l===0?100:100-100/(1+g/l)};
function piv(b,k=4){const o=[];for(let i=k;i<b.length-k;i++){let h=1,l=1;for(let j=1;j<=k;j++){if(b[i].high<=b[i-j].high||b[i].high<b[i+j].high)h=0;if(b[i].low>=b[i-j].low||b[i].low>b[i+j].low)l=0}if(h)o.push({i,p:b[i].high});if(l)o.push({i,p:b[i].low})}return o}
function zones(P,atr){
 const a=[...P].sort((x,y)=>x.p-y.p),G=[];
 a.forEach(q=>{const g=G[G.length-1];if(g&&q.p-g[g.length-1].p<=atr*.7&&q.p-g[0].p<=atr*1.6)g.push(q);else G.push([q])});
 return G.map(g=>{let lo=Math.min(...g.map(x=>x.p)),hi=Math.max(...g.map(x=>x.p));
  if(hi-lo<atr*.35){const m=(hi+lo)/2;lo=m-atr*.175;hi=m+atr*.175}
  return{lo,hi,c:(lo+hi)/2,n:g.length,last:Math.max(...g.map(x=>x.i))}});
}
const MAXP=[3,1,1,1,2,1,1];
const LBL=()=>[L('Prekje historike','Historical touches'),L('Freskia e zonës','Zone freshness'),L('Konfluencë EMA50/200','EMA50/200 confluence'),L('Nivel i rrumbullakët','Round level'),L('Trendi H1/H4','H1/H4 trend'),L('Afërsia me çmimin','Proximity to price'),'Risk/Reward ≥ 2'];
const TIP=()=>[
 L('Sa herë çmimi është kthyer nga kjo zonë. Më shumë prekje, zonë më e fortë (maks 3).','How many times price reversed from this zone. More touches, stronger zone (max 3).'),
 L('Prekja e fundit është brenda 120 qirinjve të fundit.','The last touch is within the last 120 candles.'),
 L('Zona është afër EMA50 ose EMA200, ku shpesh ka reagim.','The zone is near EMA50 or EMA200, where price often reacts.'),
 L('Zona është afër një numri të rrumbullakët si 3850 ose 3900.','The zone is near a round number like 3850 or 3900.'),
 L('Plani është në favor të trendit H4 (ose H1). Kundër trendit merr 0 pikë.','The plan is in line with the H4 (or H1) trend. Against the trend scores 0.'),
 L('Çmimi është brenda 3 ATR nga zona.','Price is within 3 ATR of the zone.'),
 L('Fitimi i TP1 është të paktën dy herë rreziku.','TP1 profit is at least twice the risk.')];
function score(z,side,X){
 const al=side==='buy'?X.htf:-X.htf;
 return[Math.min(3,z.n),(X.n-z.last)<120?1:0,(Math.abs(z.c-X.e50)<.6*X.atr||Math.abs(z.c-X.e200)<.6*X.atr)?1:0,
  Math.abs(z.c-Math.round(z.c/50)*50)<.5*X.atr?1:0,al>0?2:al===0?1:0,Math.abs(X.price-z.c)<3*X.atr?1:0];
}
function mkPlan(side,Z,X,sp){
 const buy=side==='buy';
 const cand=Z.filter(z=>(buy?z.c<=X.price+.3*X.atr:z.c>=X.price-.3*X.atr)&&Math.abs(z.c-X.price)<12*X.atr);
 if(!cand.length)return null;
 let best=null;
 cand.forEach(z=>{const br=score(z,side,X),s=br.reduce((a,b)=>a+b,0);
  if(!best||s>best.s||(s===best.s&&Math.abs(z.c-X.price)<Math.abs(best.z.c-X.price)))best={z,br,s}});
 const z=best.z,entry=buy?z.hi:z.lo,sl=buy?z.lo-.4*X.atr-sp:z.hi+.4*X.atr+sp,risk=Math.abs(entry-sl);
 const edges=Z.map(o=>buy?o.lo:o.hi).filter(q=>buy?q>entry+1.2*risk:q<entry-1.2*risk).sort((a,b)=>buy?a-b:b-a);
 const tp1=edges.length?edges[0]:(buy?entry+1.5*risk:entry-1.5*risk);
 let tp2=edges.length>1?edges[1]:(buy?entry+3*risk:entry-3*risk);
 if(buy?tp2<=tp1:tp2>=tp1)tp2=buy?tp1+1.5*risk:tp1-1.5*risk;
 const rr1=Math.abs(tp1-entry)/risk,rr2=Math.abs(tp2-entry)/risk,br=best.br.concat([rr1>=2?1:0]);
 return{side,z,entry,sl,tp1,tp2,risk,rr1,rr2,br,s:br.reduce((a,b)=>a+b,0)};
}
function status(P,X){
 const buy=P.side==='buy',c=X.last,px=X.price,t=.1*X.atr;
 if(buy?px<P.sl:px>P.sl)return'dead';
 const inz=px>=P.z.lo-t&&px<=P.z.hi+t;
 const conf=buy?(c.low<=P.z.hi+t&&c.close>P.z.hi&&c.close>c.open):(c.high>=P.z.lo-t&&c.close<P.z.lo&&c.close<c.open);
 if(conf&&Math.abs(px-P.entry)>P.risk)return'late';
 return conf?'conf':inz?'zone':'wait';
}
function verdict(P,N){
 if(!P)return{k:'n',t:L('PA ZONË','NO ZONE'),d:L('Nuk ka zonë të qartë në këtë timeframe. Provo 15m ose 1h.','No clear zone on this timeframe. Try 15m or 1h.')};
 if(N.state==='block')return{k:'bad',t:L('MOS TREGTO','DO NOT TRADE'),d:L('Lajm High i USD brenda dritares së rrezikut. Prit që tregu të qetësohet.','High-impact USD news inside the risk window. Wait for the market to calm down.')};
 if(P.st==='dead')return{k:'bad',t:L('ANULUAR','CANCELLED'),d:L('Çmimi ka kaluar stop loss-in e planit. Kjo zonë nuk vlen më.','Price has crossed the plan\'s stop loss. This zone is no longer valid.')};
 if(P.rr1<1.5||P.s<5)return{k:'bad',t:L('MOS TREGTO','DO NOT TRADE'),d:P.rr1<1.5?L('Risk/Reward është nën 1:1.5, nuk ia vlen.','Risk/Reward is below 1:1.5, not worth it.'):L('Zona është e dobët (nën 5 nga 10 pikë).','The zone is weak (under 5 out of 10 points).')};
 if(P.st==='conf')return{k:'good',t:L('TREGTO','TRADE'),d:L('Qiri i fundit i mbyllur e konfirmoi zonën. Hyr me lotin e llogaritur dhe me SL.','The last closed candle confirmed the zone. Enter with the calculated lot and a stop loss.')};
 if(P.st==='late')return{k:'warn',t:L('VONË','TOO LATE'),d:L('Lëvizja ka ikur nga zona. Mos e ndiq çmimin, prit një tërheqje.','Price has moved away from the zone. Do not chase it, wait for a pullback.')};
 if(P.st==='zone')return{k:'warn',t:L('PRIT KONFIRMIM','WAIT FOR CONFIRMATION'),d:L('Çmimi është në zonë. Prit një qiri refuzimi që mbyllet jashtë zonës.','Price is in the zone. Wait for a rejection candle that closes outside it.')};
 return{k:'n',t:L('PRIT','WAIT'),d:L('Çmimi nuk e ka arritur zonën ende. Plani vlen deri te stop loss-i.','Price has not reached the zone yet. The plan stays valid until the stop loss.')};
}
const ST=()=>({wait:L('Në pritje','Waiting'),zone:L('Në zonë','In zone'),conf:L('Konfirmuar','Confirmed'),late:L('Vonë','Late'),dead:L('Anuluar','Cancelled')});
function news(){
 let ev=[];try{ev=JSON.parse(localStorage.getItem('ffc'))||[]}catch(e){}
 const now=Date.now();let best=null,state='ok';
 ev.forEach(e=>{if(e.country!=='USD'||(e.impact!=='High'&&e.impact!=='Medium'))return;
  const t=new Date(e.date).getTime(),m=(t-now)/6e4,hi=e.impact==='High';
  if(hi&&m>=-20&&m<=30)state='block';
  else if(state!=='block'&&((hi&&m>30&&m<=120)||(!hi&&m>=-5&&m<=15)))state='warn';
  if(hi&&m>=-20&&(!best||t<best.t))best={t,m,title:e.title}});
 return{state,best,has:ev.length>0};
}
const fm=m=>{m=Math.abs(Math.round(m));const h=Math.floor(m/60);return h?h+L('o ','h ')+(m%60)+'min':m+'min'};

/* ---------- gjendja ---------- */
const DEF=()=>[0,1].map(i=>({n:L('Llogaria ','Account ')+'AB'[i],init:10000,sod:10000,eq:10000,dl:5,dd:10,tg:10}));
const S={bars:[],tf:'15m',X:null,plans:{},side:'buy',user:false,htf:{h1:0,h4:0},sc:null,
 sp:LS.get('pr_sp',0.3),risk:LS.get('pr_rk',0.5),acc:LS.get('pr_acc',null),man:[false,false],G:[],lastRun:0,wasGo:false,spTf:''};
if(!Array.isArray(S.acc)||S.acc.length!==2)S.acc=DEF();

/* ---------- CSS ---------- */
const CSS=`
@property --pa{syntax:'<angle>';initial-value:0deg;inherits:false}
#pro,#guard{position:relative}
#pro::before,#guard::before{content:"";position:absolute;z-index:-1;width:520px;height:520px;border-radius:50%;pointer-events:none;animation:pro-orb 18s ease-in-out infinite}
#pro::before{background:radial-gradient(circle,rgba(111,142,224,.32),transparent 65%);right:-160px;top:20px}
#guard::before{background:radial-gradient(circle,rgba(79,174,148,.22),transparent 65%);left:-180px;top:100px;animation-delay:-7s}
@keyframes pro-orb{50%{transform:translate(-50px,60px) scale(1.18)}}
.pr-grid{display:grid;grid-template-columns:1fr 1.1fr;gap:20px}
.pr-accs{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.pr-card{position:relative;border:1px solid var(--line);border-radius:28px;padding:clamp(18px,2.6vw,30px);background:linear-gradient(160deg,rgba(205,218,245,.08),rgba(205,218,245,.02));box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 30px 60px -30px rgba(0,0,0,.6);opacity:0;transform:translateY(22px);transition:opacity .7s,transform .7s cubic-bezier(.2,.8,.2,1),border-color .5s}
.pr-card.in{opacity:1;transform:none}
.pr-card.tl{transition:opacity .7s,transform .12s linear,border-color .5s}
.pr-card h3{font-family:var(--serif);font-weight:500;font-size:1.5rem;margin-bottom:4px}
.pr-note{color:var(--mute);font-size:.85rem;font-weight:300}
.pr-v{--vc:var(--opal);border-color:transparent}
.pr-v[data-k=good]{--vc:var(--up)}.pr-v[data-k=bad]{--vc:var(--down)}.pr-v[data-k=warn]{--vc:#F5C86B}
.pr-v::after{content:"";position:absolute;inset:-1px;border-radius:inherit;padding:2px;pointer-events:none;background:conic-gradient(from var(--pa),rgba(255,255,255,.04) 0 55%,var(--vc) 85%,#fff 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);mask-composite:exclude;animation:pr-rot 4s linear infinite}
.pr-v[data-k=good]::after{animation-duration:2.2s}
@keyframes pr-rot{to{--pa:360deg}}
.pr-v.in{animation:pr-br 3.4s ease-in-out infinite}
@keyframes pr-br{50%{box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 70px -20px var(--vc)}}
.pr-vtop{display:flex;gap:26px;align-items:center;flex-wrap:wrap}
.pr-gauge{position:relative;width:150px;height:150px;flex:none}
.pr-gauge svg{width:100%;height:100%}.pr-gauge circle{fill:none;stroke-width:9}
.pr-gauge .bg{stroke:rgba(205,218,245,.1)}
.pr-gauge .tk{stroke-width:4;stroke:rgba(205,218,245,.2);stroke-dasharray:2 8.05;transform-origin:70px 70px;animation:pr-spin 40s linear infinite}
@keyframes pr-spin{to{transform:rotate(360deg)}}
.pr-gauge .fg{stroke:var(--vc);stroke-linecap:round;stroke-dasharray:339.3;stroke-dashoffset:339.3;transition:stroke-dashoffset 1.1s cubic-bezier(.2,.8,.2,1),stroke .4s;filter:drop-shadow(0 0 8px var(--vc))}
.pr-gv{position:absolute;inset:0;display:flex;align-items:baseline;justify-content:center;padding-top:50px;font-family:var(--serif)}
.pr-gv b{font-size:2.8rem;font-weight:500;line-height:1;font-variant-numeric:tabular-nums}.pr-gv span{color:var(--mute);font-size:1rem;margin-left:2px}
.pr-verd{font-family:var(--serif);font-size:clamp(1.8rem,4vw,2.5rem);line-height:1.05;color:var(--vc);transition:color .4s}
.pr-verd.chg{animation:pr-chg .6s cubic-bezier(.2,.8,.2,1)}
@keyframes pr-chg{from{opacity:0;transform:translateY(12px) scale(.96);filter:blur(6px)}}
.pr-vd{color:#CBD5EA;font-weight:300;margin-top:10px;max-width:38ch;font-size:.95rem}
.pr-chips{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0 6px}
.pr-chips .chip.w{border-color:#F5C86B;color:#F5C86B}.pr-chips .chip.b{border-color:var(--down);color:var(--down);animation:pr-s 1.4s ease-in-out infinite}
.pr-spk{display:block;width:100%;height:56px;margin:14px 0 4px;color:var(--vc)}
.pr-spk .l{fill:none;stroke:currentColor;stroke-width:2;stroke-linejoin:round;stroke-linecap:round}
.pr-spk .l.dr{stroke-dasharray:1;animation:pr-dr 1.6s ease forwards}
@keyframes pr-dr{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}
.pr-bk{margin-top:14px;display:grid;gap:11px}
.pr-bk .r{position:relative;display:grid;grid-template-columns:minmax(120px,170px) 1fr 38px;gap:12px;align-items:center;font-size:.85rem;color:var(--mute);cursor:help;outline:none}
.pr-bk .r:hover span:first-child,.pr-bk .r:focus span:first-child{color:var(--ink)}
.pr-bk .r::after{content:attr(data-tip);position:absolute;left:0;bottom:calc(100% + 6px);max-width:300px;padding:8px 12px;border-radius:12px;background:rgba(10,18,34,.97);border:1px solid var(--line);color:#CBD5EA;font-size:.78rem;line-height:1.4;opacity:0;transform:translateY(4px);pointer-events:none;transition:.2s;z-index:6}
.pr-bk .r:hover::after,.pr-bk .r:focus::after{opacity:1;transform:none}
.pr-bk i{display:block;height:6px;border-radius:6px;background:rgba(0,0,0,.28);overflow:hidden}
.pr-bk b{display:block;height:100%;width:0;border-radius:6px;background:var(--vc);transition:width .9s cubic-bezier(.2,.8,.2,1) var(--d,0s)}
.pr-bk em{font-style:normal;text-align:right;font-variant-numeric:tabular-nums;color:var(--ink)}
.pr-ptop{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:6px}
.pr-ptop .seg{width:200px}
.pr-ptop .seg button.pf::after{content:" ★";font-size:.8em}
.pr-lad{position:relative;height:330px;margin:22px 8px 18px 4px;border-left:1px dashed var(--line);--zc:154,217,191;touch-action:pan-y}
.pr-card[data-side=sell] .pr-lad{--zc:235,163,163}
.pr-band{position:absolute;left:0;right:0;top:40%;height:8%;background:linear-gradient(90deg,rgba(var(--zc),.28),rgba(var(--zc),.04));border:1px solid rgba(var(--zc),.55);border-left:0;border-radius:0 10px 10px 0;transition:top .9s cubic-bezier(.2,.8,.2,1),height .9s cubic-bezier(.2,.8,.2,1)}
.pr-band span{position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:.75rem;color:rgba(var(--zc),1);font-weight:600}
.pr-ln{position:absolute;left:0;right:0;height:0;border-top:1px dashed currentColor;transition:top .9s cubic-bezier(.2,.8,.2,1);top:50%;cursor:copy}
.pr-ln::before{content:"";position:absolute;left:0;right:0;top:-9px;height:18px}
.pr-ln em,.pr-ln b{position:absolute;top:-11px;font-size:.78rem;background:rgba(10,18,34,.92);padding:2px 9px;border-radius:99px;font-style:normal;transition:.2s}
.pr-ln em{left:10px;border:1px solid currentColor}.pr-ln b{right:0;font-weight:600;font-variant-numeric:tabular-nums;padding:2px 6px}
.pr-ln:hover em{background:currentColor;color:#0A1222}
.pr-ln.sl{color:var(--down)}.pr-ln.tp{color:var(--up)}.pr-ln.en{color:var(--opal)}
.pr-px{position:absolute;left:0;right:0;height:0;top:50%;transition:top .6s cubic-bezier(.2,.8,.2,1);z-index:2;pointer-events:none}
.pr-px i{position:absolute;left:-7px;top:-6px;width:12px;height:12px;border-radius:50%;background:#fff;box-shadow:0 0 0 0 rgba(255,255,255,.6);animation:pr-p 1.8s infinite}
.pr-px b{position:absolute;left:50%;top:-13px;transform:translateX(-50%);padding:3px 12px;border-radius:99px;background:linear-gradient(135deg,#fff,#C9D3EA);color:#0A1222;font-size:.82rem;font-variant-numeric:tabular-nums;transition:background .4s}
.pr-px b.w{background:linear-gradient(135deg,#B9F0D8,#9AD9BF)}.pr-px b.l{background:linear-gradient(135deg,#F7CFCF,#EBA3A3)}
.pr-px::before{content:"";position:absolute;left:0;right:0;top:0;border-top:1px solid rgba(255,255,255,.35)}
@keyframes pr-p{70%{box-shadow:0 0 0 12px rgba(255,255,255,0)}100%{box-shadow:0 0 0 0 rgba(255,255,255,0)}}
.pr-cur{position:absolute;left:0;right:0;height:0;border-top:1px solid rgba(255,255,255,.55);opacity:0;transition:opacity .2s;pointer-events:none;z-index:3}
.pr-cur.on{opacity:1}
.pr-cur b{position:absolute;left:50%;top:14px;transform:translateX(-50%);white-space:nowrap;padding:4px 12px;border-radius:12px;font-size:.78rem;font-variant-numeric:tabular-nums;background:rgba(10,18,34,.96);border:1px solid var(--line);color:var(--ink)}
.pr-cur[data-w="1"] b{border-color:rgba(154,217,191,.7);color:var(--up)}.pr-cur[data-w="0"] b{border-color:rgba(235,163,163,.7);color:var(--down)}
.pr-lad.off>*{opacity:0}
.pr-lad .msg{position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;color:var(--mute);padding:20px}.pr-lad.off .msg{display:flex;opacity:1}
.pr-hint{color:var(--mute);font-size:.78rem;margin:-6px 0 14px;font-weight:300}
.pr-cp{cursor:copy;border-bottom:1px dashed var(--mute);transition:.2s}.pr-cp:hover{color:var(--opal)}
.pr-sw{display:flex;gap:10px;align-items:center;margin-top:14px;font-size:.85rem;color:var(--mute)}
.pr-sw input{width:90px;padding:8px 12px;border-radius:99px;font-size:.9rem}
.pr-alert{margin-bottom:18px;padding:16px 22px;border-radius:20px;background:rgba(235,163,163,.12);border:1px solid rgba(235,163,163,.6);color:var(--down);font-weight:600;animation:pr-s 1.4s ease-in-out infinite}
.pr-alert[hidden]{display:none}
@keyframes pr-s{50%{box-shadow:0 0 40px -8px rgba(235,163,163,.6)}}
.pr-gh{display:flex;flex-wrap:wrap;gap:18px;align-items:center;justify-content:space-between;margin-bottom:20px}
.pr-rk{display:flex;align-items:center;gap:14px;min-width:260px}.pr-rk input[type=range]{padding:0;accent-color:#A8C2F0;background:none;border:0}.pr-rk b{min-width:62px;font-variant-numeric:tabular-nums}
.pr-ah{display:flex;justify-content:space-between;align-items:center;gap:12px}
.pr-nm{font-family:var(--serif);font-size:1.5rem!important;padding:6px 10px!important;background:transparent!important;border-color:transparent!important;max-width:220px}
.pr-nm:hover,.pr-nm:focus{border-color:var(--line)!important}
.pr-lights{display:flex;gap:8px;padding:8px 12px;border-radius:99px;background:rgba(0,0,0,.28)}
.pr-lights i{width:12px;height:12px;border-radius:50%;background:rgba(205,218,245,.14);transition:background .4s,box-shadow .4s}
.pr-lights[data-s=r] i:nth-child(1),.pr-lights[data-s=x] i:nth-child(1){background:var(--down);box-shadow:0 0 14px var(--down);animation:pr-p 1.4s infinite}
.pr-lights[data-s=y] i:nth-child(2){background:#F5C86B;box-shadow:0 0 14px #F5C86B}
.pr-lights[data-s=g] i:nth-child(3){background:var(--up);box-shadow:0 0 14px var(--up)}
.pr-pre{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:10px}.pr-pre span{font-size:.78rem;color:var(--mute)}
.pr-pre .pr-mini{margin-top:0}
.pr-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px 12px;margin:14px 0 14px}
.pr-fields label{font-size:.78rem;margin-bottom:4px}.pr-fields input{padding:10px 12px;font-size:.95rem}
.pr-meter{margin-top:12px}.pr-meter label{display:flex;justify-content:space-between;gap:10px;margin-bottom:6px}.pr-meter label b{color:var(--ink);font-variant-numeric:tabular-nums;text-align:right}
.pr-track{position:relative;height:10px;border-radius:8px;background:rgba(0,0,0,.3);overflow:hidden}
.pr-track .g{position:absolute;inset:0 auto 0 0;width:0;border-radius:8px;background:repeating-linear-gradient(135deg,rgba(235,163,163,.55) 0 5px,rgba(235,163,163,.18) 5px 10px);transition:width .9s cubic-bezier(.2,.8,.2,1)}
.pr-track .f{position:absolute;inset:0 auto 0 0;width:0;border-radius:8px;background:var(--up);transition:width .9s cubic-bezier(.2,.8,.2,1),background .4s;overflow:hidden}
.pr-track .f::after{content:"";position:absolute;inset:0;background:linear-gradient(100deg,transparent 30%,rgba(255,255,255,.45) 50%,transparent 70%);transform:translateX(-100%);animation:pr-sh 3.2s ease-in-out infinite}
@keyframes pr-sh{60%,100%{transform:translateX(100%)}}
.pr-track .f.y{background:#F5C86B}.pr-track .f.r{background:var(--down)}.pr-track .f.t{background:linear-gradient(90deg,#7F9CE0,#C9D3EA)}
.pr-track .m{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.35)}
.pr-if{font-size:.8rem;color:var(--mute);margin-top:8px;min-height:1.2em;transition:color .3s}.pr-if.w{color:#F5C86B}.pr-if.e{color:var(--down)}
.pr-st{margin:16px 0 6px;padding:12px 16px;border-radius:16px;font-weight:600;text-align:center;border:1px solid var(--line);transition:.4s}
.pr-st[data-s=g]{color:var(--up);border-color:rgba(154,217,191,.45)}.pr-st[data-s=y]{color:#F5C86B;border-color:rgba(245,200,107,.5)}
.pr-st[data-s=r],.pr-st[data-s=x]{color:var(--down);border-color:rgba(235,163,163,.6);background:rgba(235,163,163,.1);animation:pr-s 1.4s ease-in-out infinite}
.pr-mini{all:unset;cursor:pointer;font-size:.78rem;padding:6px 12px;border-radius:99px;border:1px solid var(--line);color:var(--mute);margin-top:10px;display:inline-block;transition:.2s}
.pr-mini:hover{color:var(--ink);border-color:rgba(168,194,240,.6);transform:translateY(-2px)}.pr-mini:focus-visible{outline:2px solid var(--opal)}
.pr-ck{display:grid;grid-template-columns:1fr 1fr;gap:10px 20px;margin:18px 0}
.pr-ck label{display:flex;gap:12px;align-items:center;margin:0;padding:12px 14px;border:1px solid var(--line);border-radius:16px;color:var(--ink);font-size:.92rem;cursor:pointer;transition:.3s}
.pr-ck label:hover{transform:translateX(4px)}.pr-ck label.auto{cursor:default}.pr-ck label.auto:hover{transform:none}
.pr-ck input{display:none}
.pr-ck .bx{width:22px;height:22px;flex:none;border-radius:8px;border:1.5px solid var(--mute);display:grid;place-items:center;transition:.3s;font-size:.8rem;color:transparent}
.pr-ck label.on{border-color:rgba(154,217,191,.5);background:rgba(154,217,191,.07)}
.pr-ck label.on .bx{background:var(--up);border-color:var(--up);color:#0A1222;animation:pr-pop .45s}
@keyframes pr-pop{40%{transform:scale(1.35)}}
.pr-ck small{display:block;color:var(--mute);font-size:.74rem}
.pr-go{position:relative;text-align:center;padding:18px;border-radius:20px;font-family:var(--serif);font-size:1.7rem;border:1px solid var(--line);color:var(--mute);transition:.5s;overflow:hidden}
.pr-go[data-ok="1"]{color:#0A1222;background:linear-gradient(135deg,#B9F0D8,#9AD9BF);border-color:transparent;box-shadow:0 0 60px -10px rgba(154,217,191,.7)}
.pr-go[data-ok="1"].burst::after{content:"";position:absolute;left:50%;top:50%;width:20px;height:20px;border-radius:50%;border:2px solid #fff;transform:translate(-50%,-50%);animation:pr-x 1s ease-out forwards}
@keyframes pr-x{to{width:900px;height:900px;opacity:0}}
.pr-toast{position:fixed;left:50%;bottom:calc(26px + env(safe-area-inset-bottom));transform:translate(-50%,30px);opacity:0;z-index:60;padding:10px 20px;border-radius:99px;background:linear-gradient(135deg,#fff,#C9D3EA);color:#0A1222;font-weight:600;font-size:.88rem;pointer-events:none;transition:.35s cubic-bezier(.2,.8,.2,1)}
.pr-toast.on{opacity:1;transform:translate(-50%,0)}
.pr-cf{position:fixed;inset:0;width:100%;height:100%;z-index:55;pointer-events:none}
@media(max-width:900px){.pr-grid,.pr-accs,.pr-ck{grid-template-columns:1fr}}
@media(max-width:520px){.pr-vtop{justify-content:center;text-align:center}.pr-bk .r{grid-template-columns:110px 1fr 34px}}
@media(prefers-reduced-motion:reduce){.pr-card{opacity:1;transform:none}#pro::before,#guard::before,.pr-v::after,.pr-v.in,.pr-alert,.pr-px i,.pr-track .f::after,.pr-st,.pr-chips .chip.b,.pr-gauge .tk,.pr-verd.chg,.pr-spk .l.dr{animation:none!important}.pr-card,.pr-ln,.pr-band,.pr-px,.pr-gauge .fg,.pr-bk b,.pr-track .f,.pr-track .g{transition:none!important}}
`;

/* ---------- ndihmës: animacione, toast, kopjim, konfeti ---------- */
function tw(el,to,fmt){
 const from=el._v==null?0:el._v;el._v=to;
 if(reduce||from===to){el.textContent=fmt(to);return}
 const t0=performance.now();
 (function step(t){const p=Math.min(1,(t-t0)/700),e=1-Math.pow(1-p,3);el.textContent=fmt(from+(to-from)*e);if(p<1)requestAnimationFrame(step)})(t0);
}
let tt;
function toast(m){let e=$('#prToast');if(!e){e=document.createElement('div');e.id='prToast';e.className='pr-toast';document.body.appendChild(e)}
 e.textContent=m;e.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>e.classList.remove('on'),1800)}
function copy(t){
 const ok=()=>toast(L('U kopjua: ','Copied: ')+t);
 const fb=()=>{const a=document.createElement('textarea');a.value=t;a.style.cssText='position:fixed;opacity:0';document.body.appendChild(a);a.select();try{document.execCommand('copy');ok()}catch(e){}a.remove()};
 try{navigator.clipboard.writeText(t).then(ok,fb)}catch(e){fb()}
}
let cf=null,parts=[],cfOn=false;
function burst(x,y){
 if(reduce)return;
 if(!cf){cf=document.createElement('canvas');cf.className='pr-cf';document.body.appendChild(cf)}
 const D=Math.min(devicePixelRatio||1,2),c=cf.getContext('2d');cf.width=innerWidth*D;cf.height=innerHeight*D;c.setTransform(D,0,0,D,0,0);
 const cols=['#9AD9BF','#B9F0D8','#A8C2F0','#ffffff','#F5C86B'];
 for(let i=0;i<80;i++){const a=Math.random()*Math.PI*2,s=4+Math.random()*8;parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-5,r:3+Math.random()*4,c:cols[i%5],life:1,rot:Math.random()*6})}
 if(cfOn)return;cfOn=true;
 (function spin(){
  c.clearRect(0,0,innerWidth,innerHeight);
  parts.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.28;p.vx*=.99;p.life-=.013;p.rot+=.2;c.globalAlpha=Math.max(0,p.life);c.fillStyle=p.c;c.save();c.translate(p.x,p.y);c.rotate(p.rot);c.fillRect(-p.r,-p.r/2,p.r*2,p.r);c.restore()});
  parts=parts.filter(p=>p.life>0);
  if(parts.length)requestAnimationFrame(spin);else{cfOn=false;c.clearRect(0,0,innerWidth,innerHeight)}
 })();
}
function tilt(card){
 if(reduce||!matchMedia('(hover:hover)').matches)return;
 card.addEventListener('pointermove',e=>{if(!card.classList.contains('in'))return;const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.classList.add('tl');card.style.transform=`perspective(1000px) rotateX(${(-y*4).toFixed(2)}deg) rotateY(${(x*5).toFixed(2)}deg)`});
 card.addEventListener('pointerleave',()=>{card.classList.remove('tl');card.style.transform=''});
}

/* ---------- DOM ---------- */
let el={};
function build(instant){
 $$('#pro,#guard').forEach(n=>n.remove());
 const labels=LBL(),tips=TIP();
 const pro=document.createElement('section');pro.id='pro';
 pro.innerHTML=`<h2>${L('Plani Pro','Pro Plan')}</h2>
 <p class="sub">${L('Zona me pikë nga 10, filtër trendi H1/H4, bllokim para lajmeve dhe stop loss me tolerancë për spread. Llogaritet mbi qirinjtë e mbyllur.','Zones scored out of 10, an H1/H4 trend filter, news blocking and a spread-aware stop loss. Calculated on closed candles.')}</p>
 <div class="pr-grid">
  <div class="pr-card pr-v glow" id="prV" data-k="n">
   <div class="pr-vtop">
    <div class="pr-gauge"><svg viewBox="0 0 140 140" aria-hidden="true"><circle class="tk" cx="70" cy="70" r="64"/><circle class="bg" cx="70" cy="70" r="54"/><circle class="fg" id="gFg" cx="70" cy="70" r="54" transform="rotate(-90 70 70)"/></svg><div class="pr-gv"><b id="gN">0</b><span>/10</span></div></div>
    <div><div class="pr-verd" id="vT">${L('Duke analizuar…','Analyzing…')}</div><div class="pr-vd" id="vD"></div></div>
   </div>
   <svg class="pr-spk" viewBox="0 0 400 56" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="spg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="currentColor" stop-opacity=".3"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></linearGradient></defs><path class="a" fill="url(#spg)"/><path class="l" pathLength="1"/></svg>
   <div class="pr-chips" id="vC"></div>
   <div class="pr-bk" id="bk">${labels.map((l,i)=>`<div class="r" tabindex="0" data-tip="${tips[i].replace(/"/g,'&quot;')}"><span>${l}</span><i><b style="--d:${i*.07}s"></b></i><em>0/${MAXP[i]}</em></div>`).join('')}</div>
  </div>
  <div class="pr-card pr-pl glow" id="prP" data-side="buy">
   <div class="pr-ptop"><h3 id="pH">${L('Plani Buy','Buy plan')}</h3><div class="seg" id="pS"><button data-s="buy" class="a">Buy</button><button data-s="sell">Sell</button></div></div>
   <div class="pr-note" id="pTf"></div>
   <div class="pr-lad off" id="lad">
    <div class="msg">${L('Nuk ka zonë të qartë për këtë anë.','No clear zone for this side.')}</div>
    <div class="pr-band" id="lZ"><span id="lZt">${L('Zona','Zone')}</span></div>
    <div class="pr-ln sl" id="lSL"><em>SL</em><b></b></div>
    <div class="pr-ln en" id="lEN"><em>${L('Hyrja','Entry')}</em><b></b></div>
    <div class="pr-ln tp" id="lT1"><em>TP1</em><b></b></div>
    <div class="pr-ln tp" id="lT2"><em>TP2</em><b></b></div>
    <div class="pr-px" id="lPX"><i></i><b>—</b></div>
    <div class="pr-cur" id="lCur"><b></b></div>
   </div>
   <div class="pr-hint">${L('Kalo kursorin mbi shkallë për të parë fitimin/humbjen në çdo çmim. Kliko një nivel për ta kopjuar.','Move the cursor over the ladder to see profit/loss at any price. Click a level to copy it.')}</div>
   <div class="row"><span>${L('Zona e hyrjes','Entry zone')}</span><span id="rZ">—</span></div>
   <div class="row"><span>${L('Rreziku','Risk')}</span><span id="rR">—</span></div>
   <div class="row"><span>Risk/Reward TP1 · TP2</span><span id="rRR">—</span></div>
   <div id="pLots"></div>
   <label class="pr-sw" for="sp">${L('Buffer për spread/slippage ($)','Spread/slippage buffer ($)')}<input id="sp" type="number" step="0.05" min="0" value="${S.sp}" inputmode="decimal"></label>
  </div>
 </div>
 <p class="disc">${L('Jo këshillë financiare. Çmimi vjen nga PAXG i kalibruar, ndaj kontrollo gjithmonë nivelet në platformën e prop firm-it para se të hysh.','Not financial advice. The price comes from calibrated PAXG, so always check the levels on your prop firm platform before entering.')}</p>`;
 const gd=document.createElement('section');gd.id='guard';
 gd.innerHTML=`<h2>Prop Firm Guard</h2>
 <p class="sub">${L('Vendos rregullat e challenge-it për secilën llogari. Faqja të tregon sa buxhet të ka mbetur dhe të ndalon para se ta kalosh kufirin.','Enter the challenge rules for each account. The page shows how much budget you have left and warns you before you hit the limit.')}</p>
 <div class="pr-alert" id="prAl" hidden></div>
 <div class="pr-gh"><div class="pr-rk"><label for="rk" style="margin:0">${L('Rreziku për trade','Risk per trade')}</label><input id="rk" type="range" min="0.1" max="2" step="0.05" value="${S.risk}"><b id="rkv"></b></div>
 <span class="pr-note">${L('Ruhet vetëm në këtë shfletues. Rregullat ndryshojnë nga një firmë te tjetra, kontrollo tëndet.','Saved only in this browser. Rules differ between firms, check yours.')}</span></div>
 <div class="pr-accs" id="accs"></div>
 <div class="pr-card glow" id="prC" style="margin-top:20px">
  <h3>${L('Checklist para hyrjes','Pre-entry checklist')}</h3><div class="pr-note">${L('Katër pika kontrollohen automatikisht, dy i vendos ti.','Four items are checked automatically, you tick the other two.')}</div>
  <div class="pr-ck" id="ck"></div><div class="pr-go" id="go" data-ok="0">${L('Jo ende','Not yet')}</div></div>`;
 const an=$('#analiza');an.insertAdjacentElement('afterend',pro);pro.insertAdjacentElement('afterend',gd);
 const FIELDS=[['init',L('Balanca fillestare','Starting balance')],['sod',L('Equity në fillim të ditës','Equity at start of day')],['eq',L('Equity tani','Equity now')],['dl',L('Kufiri ditor %','Daily loss limit %')],['dd',L('Max drawdown %','Max drawdown %')],['tg',L('Target %','Target %')]];
 $('#accs').innerHTML=S.acc.map((a,i)=>`<div class="pr-card glow" data-i="${i}">
  <div class="pr-ah"><input class="pr-nm" data-k="n" value="${String(a.n).replace(/"/g,'&quot;')}" aria-label="${L('Emri i llogarisë','Account name')}"><div class="pr-lights" data-s="g"><i></i><i></i><i></i></div></div>
  <div class="pr-pre"><span>${L('Madhësia:','Size:')}</span>${[10,25,50,100].map(k=>`<button type="button" class="pr-mini" data-sz="${k}">${k}K</button>`).join('')}</div>
  <div class="pr-fields">${FIELDS.map(([k,l])=>`<div><label for="a${i}${k}">${l}</label><input id="a${i}${k}" data-k="${k}" type="number" step="any" value="${a[k]}" inputmode="decimal"></div>`).join('')}</div>
  <button class="pr-mini" data-day="${i}" type="button" style="margin-top:0">${L('Ditë e re (equity tani → fillim dite)','New day (equity now → start of day)')}</button>
  ${[['d',L('Humbja ditore','Daily loss')],['w',L('Drawdown total','Total drawdown')],['t',L('Progresi drejt target-it','Progress to target')]].map(([k,l])=>`<div class="pr-meter"><label>${l}<b data-o="${k}">—</b></label><div class="pr-track">${k==='t'?'':`<i class="g" data-g="${k}"></i>`}<i class="f ${k==='t'?'t':''}" data-b="${k}"></i>${k==='t'?'':'<i class="m" style="left:35%"></i><i class="m" style="left:60%"></i>'}</div></div>`).join('')}
  <div class="pr-if" data-o="if"></div>
  <div class="pr-st" data-o="st" data-s="g">—</div>
  <div class="row"><span>${L('Rreziku i lejuar tani','Allowed risk now')}</span><span data-o="rk">—</span></div>
  <div class="row"><span>${L('Lot sipas planit aktual','Lot for the current plan')}</span><span data-o="lt">—</span></div>
  <div class="pr-note" data-o="cap" style="margin-top:8px"></div></div>`).join('');
 $('#ck').innerHTML=[[L('Lajmi është i sigurt','News is safe'),1],[L('Qiri i fundit e konfirmoi zonën','The last candle confirmed the zone'),1],[L('Plani kalon filtrat (RR dhe pikët)','The plan passes the filters (RR and score)'),1],[L('Buxheti i llogarive është në rregull','Account budgets are fine'),1],[L('E vura stop loss-in në platformë','I set the stop loss on the platform'),0],[L('Nuk po hakmerrem pas një humbjeje','I am not revenge trading after a loss'),0]]
  .map(([t,a],i)=>`<label class="${a?'auto':''}" data-i="${i}"><input type="checkbox" ${a?'disabled':''}><span class="bx">✓</span><span>${t}${a?'<small>'+L('automatik','automatic')+'</small>':''}</span></label>`).join('');
 el={V:$('#prV'),P:$('#prP'),vT:$('#vT'),vD:$('#vD'),vC:$('#vC'),gFg:$('#gFg'),gN:$('#gN'),bk:$$('#bk .r'),lad:$('#lad'),al:$('#prAl'),go:$('#go')};
 /* ngjarjet */
 $$('#pS button').forEach(b=>b.onclick=()=>{S.user=true;S.side=b.dataset.s;paint()});
 $('#sp').addEventListener('input',e=>{S.sp=Math.max(0,num(e.target.value));LS.set('pr_sp',S.sp);run(true)});
 const rk=$('#rk'),rkv=$('#rkv');
 rk.addEventListener('input',()=>{S.risk=num(rk.value);rkv.textContent=S.risk.toFixed(2)+'%';LS.set('pr_rk',S.risk);gcalc()});rkv.textContent=S.risk.toFixed(2)+'%';
 $$('#accs .pr-card').forEach(card=>{const i=+card.dataset.i;
  card.addEventListener('input',e=>{const k=e.target.dataset.k;if(!k)return;S.acc[i][k]=k==='n'?e.target.value:num(e.target.value);LS.set('pr_acc',S.acc);gcalc()});
  $('[data-day]',card).onclick=()=>{S.acc[i].sod=S.acc[i].eq;$('[data-k=sod]',card).value=S.acc[i].eq;LS.set('pr_acc',S.acc);gcalc();toast(L('Ditë e re e shënuar','New day set'))};
  $$('[data-sz]',card).forEach(b=>b.onclick=()=>{const v=+b.dataset.sz*1000;Object.assign(S.acc[i],{init:v,sod:v,eq:v});['init','sod','eq'].forEach(k=>$(`[data-k=${k}]`,card).value=v);LS.set('pr_acc',S.acc);gcalc();toast(L('Llogaria vendoset në ','Account set to ')+b.dataset.sz+'K')})});
 $$('#ck label:not(.auto)').forEach(l=>l.addEventListener('click',e=>{e.preventDefault();const i=+l.dataset.i-4;S.man[i]=!S.man[i];ckPaint()}));
 /* shkalla: kursori dhe kopjimi */
 const lad=$('#lad');
 lad.addEventListener('pointermove',e=>{
  const P=S.plans[S.side];if(!P||!S.sc)return;
  const r=lad.getBoundingClientRect(),f=Math.min(1,Math.max(0,(e.clientY-r.top)/r.height)),pr=S.sc.mx-f*(S.sc.mx-S.sc.mn),buy=P.side==='buy',d=buy?pr-P.entry:P.entry-pr,R=d/P.risk;
  const cur=$('#lCur');cur.style.top=(f*100)+'%';cur.classList.add('on');cur.dataset.w=R>=0?'1':'0';
  let txt=f2(pr)+' · '+(R>=0?'+':'')+R.toFixed(2)+'R';
  S.G.forEach((g,i)=>{if(g.lots>0){const u=d*100*g.lots;txt+=` · ${'AB'[i]} ${u>=0?'+':'-'}$${f2(Math.abs(u))}`}});
  $('b',cur).textContent=txt});
 lad.addEventListener('pointerleave',()=>$('#lCur').classList.remove('on'));
 $$('.pr-ln',lad).forEach(n=>n.addEventListener('click',()=>n.dataset.p&&copy(n.dataset.p)));
 $('#pLots').addEventListener('click',e=>{const c=e.target.closest('[data-copy]');c&&copy(c.dataset.copy)});
 /* hyrja në ekran, animacione */
 const cards=$$('.pr-card');
 if(instant||!('IntersectionObserver'in window))cards.forEach(c=>c.classList.add('in'));
 else{const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.style.transitionDelay=(cards.indexOf(e.target)%2)*.12+'s';e.target.classList.add('in');io.unobserve(e.target);setTimeout(()=>{e.target.style.transitionDelay=''},1000)}}),{threshold:.12});cards.forEach(c=>io.observe(c));setTimeout(()=>cards.forEach(c=>c.classList.add('in')),3500)}
 tilt($('#prV'));tilt($('#prP'));
}

/* ---------- analiza ---------- */
const HOSTS=['https://api.binance.com','https://data-api.binance.vision'];
async function get(q){for(const h of HOSTS){try{const r=await fetch(h+q);if(r.ok)return await r.json()}catch(e){}}throw 0}
async function loadHtf(){
 for(const [key,iv] of [['h1','1h'],['h4','4h']]){
  try{const d=await get('/api/v3/klines?symbol=PAXGUSDT&interval='+iv+'&limit=260'),c=d.slice(0,-1).map(k=>+k[4]),p=c[c.length-1],a=ema(c,20).pop(),b=ema(c,50).pop();
   S.htf[key]=(p>b&&a>b)?1:(p<b&&a<b)?-1:0}catch(e){}}
 run(true);
}
function run(force){
 const B=S.bars;if(B.length<80||!el.V)return;
 const now=Date.now();if(!force&&now-S.lastRun<2000)return;S.lastRun=now;
 const cl=B.slice(0,-1),n=cl.length,last=cl[n-1],price=B[B.length-1].close,c=cl.map(x=>x.close);
 const tr=cl.map((x,i)=>i?Math.max(x.high-x.low,Math.abs(x.high-cl[i-1].close),Math.abs(x.low-cl[i-1].close)):x.high-x.low);
 const atr=avg(tr.slice(-14));
 const X={price,atr,n,last,e20:ema(c,20)[n-1],e50:ema(c,50)[n-1],e200:ema(c,200)[n-1],r:rsi(c),vol:atr/avg(tr.slice(-100)),htf:S.htf.h4||S.htf.h1};
 const Z=zones(piv(cl),atr),pb=mkPlan('buy',Z,X,S.sp),ps=mkPlan('sell',Z,X,S.sp);
 [pb,ps].forEach(P=>{if(P)P.st=status(P,X)});
 S.X=X;S.plans={buy:pb,sell:ps};
 if(!S.user)S.side=(pb&&ps)?(pb.s>=ps.s?'buy':'sell'):ps&&!pb?'sell':'buy';
 paint();
}
function spark(){
 const c=S.bars.slice(-80).map(b=>b.close),l=$('.pr-spk .l'),a=$('.pr-spk .a');if(c.length<5||!l)return;
 const mn=Math.min(...c),mx=Math.max(...c),W=400,H=56,p=4,pts=c.map((v,i)=>(i/(c.length-1)*W).toFixed(1)+','+(H-p-(v-mn)/((mx-mn)||1)*(H-2*p)).toFixed(1)),d='M'+pts.join('L');
 l.setAttribute('d',d);a.setAttribute('d',d+`L${W},${H}L0,${H}Z`);
 if(S.spTf!==S.tf){S.spTf=S.tf;l.classList.remove('dr');void l.getBoundingClientRect();l.classList.add('dr')}
}
function paint(){
 const X=S.X;if(!X||!el.V)return;
 const side=S.side,P=S.plans[side],N=news(),V=verdict(P,N),buy=side==='buy';S.V=V;S.N=N;
 el.V.dataset.k=V.k;
 if(el.vT.textContent!==V.t){el.vT.textContent=V.t;el.vT.classList.remove('chg');void el.vT.offsetWidth;el.vT.classList.add('chg')}
 el.vD.textContent=(buy?L('Plani Buy · ','Buy plan · '):L('Plani Sell · ','Sell plan · '))+V.d;
 const sc=P?P.s:0;el.gFg.style.strokeDashoffset=339.3*(1-sc/10);tw(el.gN,sc,v=>Math.round(v));
 const tf=v=>v>0?'▲':v<0?'▼':'◆';
 let nc='';
 if(!N.has)nc=`<span class="chip">${L('Lajme: pa të dhëna','News: no data')}</span>`;
 else if(N.best)nc=`<span class="chip ${N.state==='block'?'b':N.state==='warn'?'w':''}">${N.best.title} <b>${N.best.m>0?L('pas ','in ')+fm(N.best.m):L('doli ','released ')+fm(N.best.m)+L(' më parë',' ago')}</b></span>`;
 else nc=`<span class="chip">${L('Asnjë lajm High së shpejti','No High news soon')}</span>`;
 el.vC.innerHTML=`<span class="chip">H1 <b>${tf(S.htf.h1)}</b></span><span class="chip">H4 <b>${tf(S.htf.h4)}</b></span><span class="chip">RSI <b>${X.r.toFixed(0)}</b></span><span class="chip">ATR <b>${f2(X.atr)}$</b></span><span class="chip">Vol <b>${X.vol.toFixed(2)}x</b></span>`+nc;
 el.bk.forEach((r,i)=>{const p=P?P.br[i]:0;$('b',r).style.width=(p/MAXP[i]*100)+'%';$('em',r).textContent=p+'/'+MAXP[i]});
 spark();
 el.P.dataset.side=side;$('#pH').textContent=buy?L('Plani Buy','Buy plan'):L('Plani Sell','Sell plan');
 $$('#pS button').forEach(b=>{b.classList.toggle('a',b.dataset.s===side);const o=S.plans[b.dataset.s],q=S.plans[b.dataset.s==='buy'?'sell':'buy'];b.classList.toggle('pf',!!(o&&(!q||o.s>q.s)))});
 $('#pTf').textContent=`Timeframe ${S.tf}${P?L(' · statusi: ',' · status: ')+ST()[P.st]:''}${(S.tf==='1m'||S.tf==='5m')?L(' · timeframe i vogël, më i besueshëm te 15m ose më lart',' · small timeframe, more reliable on 15m or higher'):''}`;
 const lad=el.lad;
 if(!P){lad.classList.add('off');S.sc=null;['#rZ','#rR','#rRR'].forEach(s=>$(s).textContent='—')}
 else{
  lad.classList.remove('off');
  const vals=[P.sl,P.tp2,X.price,P.entry,P.tp1],mx0=Math.max(...vals),mn0=Math.min(...vals),pad=(mx0-mn0)*.08,mx=mx0+pad,mn=mn0-pad,y=p=>((mx-p)/(mx-mn)*100);
  S.sc={mx,mn};
  const put=(id,p)=>{const e=$(id);e.style.top=y(p)+'%';e.dataset.p=p.toFixed(2);const b=$('b',e);if(b)b.textContent=f2(p)};
  put('#lSL',P.sl);put('#lEN',P.entry);put('#lT1',P.tp1);put('#lT2',P.tp2);put('#lPX',X.price);
  $('#lPX b').className=(buy?X.price>=P.entry:X.price<=P.entry)?'w':'l';
  const b=$('#lZ');b.style.top=y(P.z.hi)+'%';b.style.height=Math.max(1.5,y(P.z.lo)-y(P.z.hi))+'%';$('#lZt').textContent=L('Zona ','Zone ')+P.z.n+'×';
  $('#rZ').textContent=f2(P.z.lo)+' – '+f2(P.z.hi);$('#rR').textContent=`${f2(P.risk)} $ · ~${Math.round(P.risk/.1)} pips`;$('#rRR').textContent=`1:${P.rr1.toFixed(1)} · 1:${P.rr2.toFixed(1)}`;
 }
 gcalc();
}

/* ---------- Prop Guard ---------- */
function gcalc(){
 const P=S.plans[S.side];if(!el.V)return;
 S.G=S.acc.map((a,i)=>{
  const card=$('#accs .pr-card[data-i="'+i+'"]');if(!card)return{lv:'g'};
  const dLim=a.init*a.dl/100,wLim=a.init*a.dd/100,tTar=a.init*a.tg/100;
  const dLoss=Math.max(0,a.sod-a.eq),wLoss=Math.max(0,a.init-a.eq),prof=Math.max(0,a.eq-a.init);
  const d=dLim>0?dLoss/dLim:0,w=wLim>0?wLoss/wLim:0,t=tTar>0?prof/tTar:0;
  const remD=Math.max(0,dLim-dLoss),remW=Math.max(0,wLim-wLoss),worst=Math.max(d,w);
  const lv=worst>=1?'x':worst>=.6?'r':worst>=.35?'y':'g';
  const want=a.init*S.risk/100,cap=Math.min(want,remD*.5,remW*.5),capped=cap<want-.005;
  const lots=P&&P.risk>0&&cap>0?Math.floor(cap/(P.risk*100)*100)/100:0;
  const lossSL=P&&lots>0?lots*P.risk*100:0,dA=dLim>0?(dLoss+lossSL)/dLim:0,wA=wLim>0?(wLoss+lossSL)/wLim:0;
  const bar=(k,v,txt,ghost)=>{const f=$(`[data-b=${k}]`,card);f.style.width=Math.min(100,v*100)+'%';if(k!=='t')f.className='f '+(v>=.6?'r':v>=.35?'y':'');
   const g=$(`[data-g=${k}]`,card);if(g)g.style.width=Math.min(100,(ghost||0)*100)+'%';$(`[data-o=${k}]`,card).textContent=txt};
  bar('d',d,`${(d*100).toFixed(0)}% · $${f2(dLoss)} / $${f2(dLim)}`,dA);
  bar('w',w,`${(w*100).toFixed(0)}% · $${f2(wLoss)} / $${f2(wLim)}`,wA);
  bar('t',t,`${Math.min(999,t*100).toFixed(0)}% · $${f2(prof)} / $${f2(tTar)}`);
  const ifE=$('[data-o=if]',card),mxA=Math.max(dA,wA);
  ifE.textContent=lossSL>0?L(`Nëse SL goditet: humbja ditore bëhet ${(dA*100).toFixed(0)}%, totale ${(wA*100).toFixed(0)}% (-$${f2(lossSL)})`,`If SL is hit: daily loss becomes ${(dA*100).toFixed(0)}%, total ${(wA*100).toFixed(0)}% (-$${f2(lossSL)})`):'';
  ifE.className='pr-if '+(mxA>=1?'e':mxA>=.6?'w':'');
  const s=$('[data-o=st]',card);s.dataset.s=lv;
  s.textContent={g:L('Siguri · vazhdo normalisht','Safe · carry on as normal'),y:L('Kujdes · ul lotin dhe shmang trade të tjera','Caution · reduce lot size and avoid extra trades'),r:L('NDALO PËR SOT','STOP FOR TODAY'),x:L('KUFIRI U KALUA · mos hap pozicione','LIMIT EXCEEDED · do not open positions')}[lv];
  $('.pr-lights',card).dataset.s=lv;
  $('[data-o=rk]',card).textContent=`$${f2(cap)} (${a.init?(cap/a.init*100).toFixed(2):0}%)`;
  $('[data-o=lt]',card).textContent=!P?'—':lots>0?`${lots.toFixed(2)} lot`:L('0.00, SL shumë i madh','0.00, SL too large');
  $('[data-o=cap]',card).textContent=capped?L('Rreziku u ul sepse buxheti i mbetur është i vogël (kurrë mbi 50% të tij).','Risk was reduced because the remaining budget is small (never above 50% of it).'):'';
  return{lv,d,w,n:a.n,lots,cap};
 });
 const bad=S.G.filter(g=>g.lv==='r'||g.lv==='x');
 if(bad.length){el.al.hidden=false;el.al.textContent=L('NDALO TRADIMIN · ','STOP TRADING · ')+bad.map(g=>`${g.n} ${L('ka përdorur','has used')} ${(Math.max(g.d,g.w)*100).toFixed(0)}% ${L('të kufirit','of the limit')}`).join(' · ')}else el.al.hidden=true;
 const Lb=$('#pLots');
 if(Lb)Lb.innerHTML=S.G.map(g=>g.n?`<div class="row"><span>${g.n} · ${L('lot për','lot for')} ${S.risk.toFixed(2)}% ${L('rrezik','risk')}</span><span>${P?(g.lots>0?`<span class="pr-cp" data-copy="${g.lots.toFixed(2)}" title="${L('Kliko për ta kopjuar','Click to copy')}">${g.lots.toFixed(2)} lot</span>`:'0.00'):'—'}</span></div>`:'').join('');
 ckPaint();
}
function ckPaint(){
 const P=S.plans[S.side],V=S.V||{},N=S.N||{state:'ok'};
 const auto=[N.state!=='block',!!P&&P.st==='conf',!!P&&V.k!=='bad'&&P.rr1>=1.5&&P.s>=5,S.G.every(g=>g.lv==='g'||g.lv==='y')];
 const all=auto.concat(S.man);
 $$('#ck label').forEach((l,i)=>l.classList.toggle('on',!!all[i]));
 const miss=all.filter(x=>!x).length,ok=!miss&&V.k==='good',g=el.go;
 g.dataset.ok=ok?'1':'0';g.textContent=ok?L('Gati për hyrje','Ready to enter'):miss?L(`Mungojnë ${miss} nga 6`,`${miss} of 6 missing`):L('Prit sinjalin','Wait for the signal');
 if(ok&&!S.wasGo){const r=g.getBoundingClientRect();g.classList.remove('burst');void g.offsetWidth;g.classList.add('burst');burst(r.left+r.width/2,r.top+r.height/2)}
 S.wasGo=ok;
}

/* ---------- lidhja me grafikun ---------- */
function init(){
 if(!$('#analiza'))return;
 const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
 build(false);
 const ul=$('nav ul');if(ul){['pro:Pro','guard:Guard'].forEach(x=>{const[a,t]=x.split(':'),li=document.createElement('li');li.innerHTML=`<a href="#${a}">${t}</a>`;ul.appendChild(li)})}
 const prev=window.onBars;
 window.onBars=(b,tf)=>{if(typeof prev==='function')prev(b,tf);S.bars=b;if(tf!==S.tf){S.tf=tf;S.lastRun=0}run(false)};
 window.addEventListener('langchange',()=>{lang=getLang();build(true);S.spTf='';if(S.X)paint();else gcalc()});
 loadHtf();setInterval(loadHtf,60000);
 setInterval(()=>{if(S.X)paint()},20000);
}
const go=()=>setTimeout(init,0);
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',go):go();
})();
