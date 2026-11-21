/* AntiBrokies add-on: news, EUR, max lots, EN/SQ, ticker, accurate chart, performance.
   Shto në <head> pas script-it të lightweight-charts:  <script src="addon.js"></script> */
(()=>{
'use strict';
let lang='sq';try{if(localStorage.getItem('lang')==='en')lang='en'}catch(e){}
const L=(a,e)=>lang==='en'?e:a;

/* ================= PERFORMANCE ================= */
const raf=window.requestAnimationFrame.bind(window);let chartVis=true;
const thr=(cb,ms,ok)=>raf(function w(t){if(ok()&&t-(cb._l||0)>=ms){cb._l=t;cb(t)}else raf(w)});
window.requestAnimationFrame=cb=>{
 if(cb.name==='draw')return thr(cb,40,()=>!document.hidden);
 if(cb.name==='frame')return thr(cb,33,()=>chartVis&&!document.hidden);
 return raf(cb)};
(()=>{const D=Intl.DateTimeFormat,c=new Map();
 const F=function(l,o){const k=String(l)+JSON.stringify(o);let f=c.get(k);if(!f){f=new D(l,o);c.set(k,f)}return f};
 F.prototype=D.prototype;F.supportedLocalesOf=D.supportedLocalesOf;Intl.DateTimeFormat=F})();

/* ================= CHART: kalibrim me çmimin spot të arit ================= */
const nf=window.fetch.bind(window);
let MAN=0;try{MAN=+localStorage.getItem('man')||0}catch(e){}   // kalibrim manual me MT5
const setMan=v=>{try{localStorage.setItem('man',v)}catch(e){}return v};
const LK={v:0,ok:false,set:false};   // offset i ngrirë për grafikun aktual (nuk lëkundet më)
const SM=[];let have=false,bad=0;
const med=()=>{const a=[...SM].sort((x,y)=>x-y),m=a.length>>1;return a.length%2?a[m]:(a[m-1]+a[m])/2};
const reloadChart=()=>{const b=document.querySelector('#tf button.a');b&&b.click()};
async function spot(){try{
 const [a,b]=await Promise.all([nf('https://api.gold-api.com/price/XAU').then(r=>r.json()),nf('https://api.binance.com/api/v3/ticker/price?symbol=PAXGUSDT').then(r=>r.json())]);
 const o=+a.price-+b.price;
 if(isFinite(o)&&Math.abs(o)<80){SM.push(o);if(SM.length>12)SM.shift();have=true;
  if(LK.set){if(!LK.ok)reloadChart();else if(Math.abs(med()-LK.v)>5){if(++bad>=3){bad=0;reloadChart()}}else bad=0}}
}catch(e){}}
const sp=spot();setInterval(spot,5000);
/* tick i shpejtë: çmimi spot i arit çdo ~1.2s, që grafiku të lëvizë live */
const SP={px:0,t:0};let ACT=null,busy=false;
async function fast(){if(busy||document.hidden)return;busy=true;try{
 const a=await nf('https://api.gold-api.com/price/XAU',{cache:'no-store'}).then(r=>r.json());const p=+a.price;
 if(isFinite(p)&&p>0){if(p!==SP.px)SP.t=Date.now();SP.px=p;ACT&&ACT.push(p+MAN)}}catch(e){}busy=false}
setInterval(fast,1200);fast();
window.fetch=async function(u,o){
 const s=String((u&&u.url)||u);
 if(s.includes('/klines?symbol=PAXGUSDT')){
  if(s.includes('limit=500')){await Promise.race([sp,new Promise(r=>setTimeout(r,1500))]);LK.v=have?med():0;LK.ok=have;LK.set=true;bad=0}
  const r=await nf(u,o);if(!r.ok)return r;const d=await r.json();
  d.forEach(k=>{for(let i=1;i<=4;i++)k[i]=String(+k[i]+LK.v+MAN)});
  return new Response(JSON.stringify(d),{status:200,headers:{'Content-Type':'application/json'}});
 }
 return nf(u,o)};
const WS=window.WebSocket;
window.WebSocket=function(u,p){
 const w=p?new WS(u,p):new WS(u);
 if(/paxgusdt@kline/i.test(String(u))){
  let tw=null,lastK=null,fn=null;
  const out=k=>fn&&fn({data:JSON.stringify({k})});
  const fresh=()=>Date.now()-SP.t<4000;   // spot po ndryshon: përdoret si burim i vetëm
  const push=px=>{if(!lastK||!isFinite(px))return;
   lastK={...lastK,c:String(px),h:String(Math.max(+lastK.h,px)),l:String(Math.min(+lastK.l,px))};out(lastK)};
  const me={push:px=>{if(fresh())push(px)}};
  ACT=me;
  try{
   tw=new WS('wss://stream.binance.com:9443/ws/paxgusdt@aggTrade');
   tw.onmessage=e=>{try{
    if(fresh()||!lastK)return;
    const t=JSON.parse(e.data);
    if(t.T>=lastK.T||t.T<lastK.t)return;
    push(+t.p+LK.v+MAN)}catch(_){}};
  }catch(_){}
  w.addEventListener('close',()=>{if(ACT===me)ACT=null;try{tw&&tw.close()}catch(_){}});
  Object.defineProperty(w,'onmessage',{configurable:true,set(f){fn=f;
   w.addEventListener('message',e=>{try{
    const j=JSON.parse(e.data);
    if(j.k){const k=j.k;['o','h','l','c'].forEach(q=>k[q]=String(+k[q]+LK.v+MAN));
     if(fresh()){const s=SP.px+MAN,same=lastK&&lastK.t===k.t;
      k.c=String(s);k.h=String(Math.max(+k.h,s,same?+lastK.h:-1e9));k.l=String(Math.min(+k.l,s,same?+lastK.l:1e9))}
     lastK=k;out(k)}else f(e)}catch(_){f(e)}})}});
 }
 return w};
window.WebSocket.prototype=WS.prototype;Object.assign(window.WebSocket,{CONNECTING:0,OPEN:1,CLOSING:2,CLOSED:3});

/* ================= GJUHA SQ / EN ================= */
const EX={
'Sesionet':'Sessions','Grafiku':'Chart','Analiza':'Analysis','Lajmet':'News','Llogaritësit':'Calculators',
'Tregu, i qetë dhe i matur.':'The market, calm and measured.',
'Hapësira ime e punës për ar. Çmimi live, sesioni që po zhvillohet dhe llogaritësit që më duhen para çdo hyrjeje.':'My gold workspace. Live price, the session in play and the calculators I need before every entry.',
'Duke ngarkuar':'Loading','Tiranë':'Tirana','Sesionet e tregut':'Market sessions',
'Orët e hapjes dhe të mbylljes së çdo sesioni janë sipas orës së Tiranës.':'Opening and closing times of each session are in Tirana time.',
'Sidnei':'Sydney','Tokio':'Tokyo','Londër':'London','Nju Jork':'New York',
'Candlestick live që përditësohet çdo sekondë. Zgjidh timeframe-in dhe kalo kursorin mbi qirinj për OHLC.':'Live candlesticks updated every second. Pick a timeframe and hover the candles for OHLC.',
'Nuk u lidh me burimin e çmimit. Kontrollo internetin dhe provo përsëri.':'Could not connect to the price source. Check your internet and try again.',
'Provo përsëri':'Try again','Analiza e tregut':'Market analysis',
'Llogaritet automatikisht nga qirinjtë live të timeframe-it që ke zgjedhur. Zonat shfaqen edhe në grafik.':'Calculated automatically from the live candles of the timeframe you picked. Zones also appear on the chart.',
'Duke analizuar…':'Analyzing…','Anash':'Sideways','Shfaq zonat Buy dhe Sell në grafik':'Show Buy and Sell zones on chart',
'Analizë teknike automatike për edukim, bazuar në EMA, RSI, MACD, ATR dhe pikat e kthimit të çmimit. Nuk është sinjal ose këshillë financiare. Gjithmonë konfirmo në platformën tënde dhe përdor stop loss.':'Automatic technical analysis for education, based on EMA, RSI, MACD, ATR and price pivots. Not a signal or financial advice. Always confirm on your own platform and use a stop loss.',
'Zgjidh instrumentin një herë, vlen për të gjithë llogaritësit. Rezultati del kur shtyp Llogarit.':'Pick the instrument once, it applies to all calculators. The result appears when you press Calculate.',
'Fitim / Humbje':'Profit / Loss','Margjina':'Margin','Madhësia e pozicionit':'Position size','Instrumenti':'Instrument',
'XAUUSD · Ar':'XAUUSD · Gold','XAGUSD · Argjend':'XAGUSD · Silver','Drejtimi':'Direction',
'Çmimi i hyrjes':'Entry price','Çmimi i daljes':'Exit price','Llogarit':'Calculate',
'Vlera e një pip (për lotin tënd)':'Value of one pip (for your lot)','Numri i pips':'Number of pips',
'Çmimi aktual (për çiftet USD/xxx)':'Current price (for USD/xxx pairs)','Vlera e një pip (1 lot)':'Value of one pip (1 lot)',
'Madhësia e një pip':'Size of one pip','Çmimi aktual':'Current price','Balanca (USD, opsionale)':'Balance (USD, optional)',
'Vlera nominale e pozicionit':'Notional position value','Margjina si % e balancës':'Margin as % of balance','Margjina e lirë':'Free margin',
'Balanca (USD)':'Balance (USD)','Rreziku (%)':'Risk (%)','Stop loss (pips)':'Stop loss (pips)','Rreziku në para':'Risk in money',
'Rreziku për pip':'Risk per pip','Hyrja':'Entry','Rreziku':'Risk','Fitimi i mundshëm':'Potential profit',
'Win rate minimal për të mos humbur':'Minimum win rate to break even','Plani Buy':'Buy plan','Plani Sell':'Sell plan',
'Preferuar':'Preferred','Zona e hyrjes':'Entry zone','Volatiliteti':'Volatility','pa të dhëna':'no data',
'Plotëso çmimin e hyrjes, daljes dhe lotin.':'Fill in entry, exit and lot.',
'Plotëso lotin, pips dhe çmimin aktual.':'Fill in lot, pips and current price.',
'Shkruaj lotin (më i madh se 0).':'Enter the lot (greater than 0).','Shkruaj çmimin aktual.':'Enter the current price.',
'Zgjidh leverage-in.':'Choose the leverage.','Plotëso balancën, rrezikun, stop loss dhe çmimin aktual.':'Fill in balance, risk, stop loss and current price.',
'Plotëso të gjitha fushat.':'Fill in all fields.','Stop loss dhe Take profit duhet të jenë në anët e kundërta të hyrjes.':'Stop loss and Take profit must be on opposite sides of the entry.',
'Stop-i është shumë i madh për këtë rrezik, as 0.01 lot nuk futet.':'The stop is too large for this risk, not even 0.01 lot fits.',
'Nuk ka zonë të qartë blerjeje në këtë timeframe. Provo një timeframe tjetër.':'No clear buy zone on this timeframe. Try another timeframe.',
'Nuk ka zonë të qartë shitjeje në këtë timeframe. Provo një timeframe tjetër.':'No clear sell zone on this timeframe. Try another timeframe.',
'© AntiBrokies. Vetëm për informim dhe llogaritje. Nuk përbën këshillë financiare. Tregtimi me levë mban rrezik humbjeje.':'© AntiBrokies. For information and calculation only. Not financial advice. Leveraged trading carries a risk of loss.'
};
const DS=[
['Hapur tani: ','Open now: '],['Forex i mbyllur për fundjavë','Forex closed for the weekend'],
['Midis sesioneve, likuiditet i ulët','Between sessions, low liquidity'],['Tregu është i mbyllur','Market is closed'],
['Hapur · mbyllet pas','Open · closes in'],['Mbyllur · hapet pas','Closed · opens in'],['Ora ','Time '],['Tiranë · ','Tirana · '],['(Tiranë)','(Tirana)'],
['e hënë','Monday'],['e martë','Tuesday'],['e mërkurë','Wednesday'],['e enjte','Thursday'],['e premte','Friday'],['e shtunë','Saturday'],['e diel','Sunday'],
['Bullish i fortë','Strong bullish'],['Bearish i fortë','Strong bearish'],['Anash, pa drejtim të qartë','Sideways, no clear direction'],
['Pikët ','Score '],[' nga 7 · timeframe ',' of 7 · timeframe '],[' · përditësuar ',' · updated '],
['15 minuta','15 minutes'],['5 minuta','5 minutes'],['1 minutë','1 minute'],['4 orë','4 hours'],['1 orë','1 hour'],['1 ditë','1 day'],
['në trend rritës të rregullt (EMA20 mbi EMA50 mbi EMA200)','in a regular uptrend (EMA20 above EMA50 above EMA200)'],
['në trend rënës të rregullt (EMA20 nën EMA50 nën EMA200)','in a regular downtrend (EMA20 below EMA50 below EMA200)'],
['pa trend të qartë, mesataret lëvizëse janë të përziera','without a clear trend, the moving averages are mixed'],
['Çmimi ','Price '],['qëndron mbi','sits above'],['qëndron nën','sits below'],[') dhe mbi EMA200',') and above EMA200'],[') dhe nën EMA200',') and below EMA200'],
['Struktura po formon maja dhe fundet gjithnjë më të larta (HH/HL).','Structure is forming higher highs and higher lows (HH/HL).'],
['Struktura po formon maja dhe fundet gjithnjë më të ulëta (LH/LL).','Structure is forming lower highs and lower lows (LH/LL).'],
['Struktura është e përzier, çmimi po lëviz si në rang.','Structure is mixed, price is moving like a range.'],
['Momenti: RSI është ','Momentum: RSI is '],['i mbiblerë, ka rrezik tërheqjeje','overbought, pullback risk'],['me forcë blerëse','with buying strength'],
['i mbishitur, mund të vijë rikthim','oversold, a rebound may come'],['me presion shitës','with selling pressure'],
['MACD është pozitiv','MACD is positive'],['MACD është negativ','MACD is negative'],[' dhe po forcohet',' and strengthening'],[' dhe po dobësohet',' and weakening'],
['Volatiliteti është ','Volatility is '],['i lartë, lëvizje më të mëdha se zakonisht','high, larger moves than usual'],['i ulët, treg i qetë','low, quiet market'],
['Konfluenca: ','Confluence: '],[' nga 4 timeframe janë rritës dhe ',' of 4 timeframes are bullish and '],[' rënës.',' bearish.'],
['Zona më e afërt e blerjes është ','The nearest buy zone is '],['Zona më e afërt e shitjes është ','The nearest sell zone is '],
[' prekje), ',' touches), '],[' poshtë çmimit.',' below price.'],[' sipër çmimit.',' above price.'],
['Nuk ka zonë të qartë blerjeje afër.','No clear buy zone nearby.'],['Nuk ka zonë të qartë shitjeje afër.','No clear sell zone nearby.'],
['Skenari kryesor është ngjitja. Hyrja Buy ka kuptim pas një tërheqjeje te zona e blerjes dhe konfirmimit (qiri rikthimi ose mbyllje mbi zonë).','Main scenario is a rise. A Buy entry makes sense after a pullback to the buy zone and confirmation (reversal candle or close above the zone).'],
['Skenari kryesor është rënia. Hyrja Sell ka kuptim pas një ngjitjeje te zona e shitjes dhe konfirmimit (qiri refuzimi ose mbyllje nën zonë).','Main scenario is a fall. A Sell entry makes sense after a rally to the sell zone and confirmation (rejection candle or close below the zone).'],
[' Skenari anulohet nëse çmimi mbyllet poshtë ',' The scenario is invalidated if price closes below '],[' Skenari anulohet nëse çmimi mbyllet mbi ',' The scenario is invalidated if price closes above '],
['Tregu nuk ka drejtim të qartë. Më e sigurt është të presësh prerjen e qartë të njërës zonë, ose të tregtosh nga skajet e rangut (Buy te zona e blerjes, Sell te zona e shitjes) me stop të ngushtë.','The market has no clear direction. Safer to wait for a clean break of one zone, or trade from the range edges (Buy at the buy zone, Sell at the sell zone) with a tight stop.'],
[' prekje historike',' historical touches'],[' · çmimi është brenda zonës tani',' · price is inside the zone now'],['. Hyr vetëm pas konfirmimit.','. Enter only after confirmation.'],
['▲ Rritës','▲ Bullish'],['▼ Rënës','▼ Bearish'],['◆ Anash','◆ Sideways'],[' i fortë ·',' strong ·'],
['Rreziku real me ','Actual risk with '],[' me leverage ',' with leverage '],[' pips rrezik, ',' pips risk, '],[' pips fitim',' pips profit']
].sort((a,b)=>b[0].length-a[0].length);
const MON=['janar','shkurt','mars','prill','maj','qershor','korrik','gusht','shtator','tetor','nëntor','dhjetor'],
 MEN=['January','February','March','April','May','June','July','August','September','October','November','December'];
const DR=[[/Në ([^,]+), ari është /,'On the $1 timeframe, gold is '],[/(\d+)o (\d+)min/g,'$1h $2min'],...MON.map((m,i)=>[new RegExp('(\\d+) '+m+'\\b','g'),'$1 '+MEN[i]])];
function tr(s){const t=s.trim();if(Object.prototype.hasOwnProperty.call(EX,t))return s.replace(t,EX[t]);
 let r=s;for(const [a,b] of DS)if(r.includes(a))r=r.split(a).join(b);for(const [a,b] of DR)r=r.replace(a,b);return r}
const rec=new WeakMap();
function proc(n){const p=n.parentNode;if(lang!=='en'||!p||p.nodeName==='SCRIPT'||p.nodeName==='STYLE')return;
 const cur=n.data,r=rec.get(n);
 if(r){if(cur===r.t)return;if(cur===r.o){if(r.t!==r.o)n.data=r.t;return}}
 const t=tr(cur);rec.set(n,{o:cur,t});if(t!==cur)n.data=t}
function walk(root){const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode()))proc(n)}
function restore(){const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;
 while((n=w.nextNode())){const r=rec.get(n);if(r&&n.data===r.t&&r.t!==r.o)n.data=r.o}}
function setLang(l){lang=l;try{localStorage.setItem('lang',l)}catch(e){}
 document.documentElement.lang=l==='en'?'en':'sq';
 if(l==='en')walk(document.body);else restore();
 document.querySelectorAll('.lg2 button').forEach(b=>b.classList.toggle('a',b.dataset.l===l));
 window.dispatchEvent(new Event('langchange'))}

/* ================= CSS ================= */
const CSS=`
nav{backdrop-filter:none!important;background:rgba(10,18,34,.95)!important}
.clock,.out,.calc,.an-main,.plan,.s{backdrop-filter:none!important}
body{background-attachment:scroll!important}
.photo{display:none!important}.bars svg{filter:none!important}
#lajmet,#llogaritesit{content-visibility:auto;contain-intrinsic-size:auto 700px}
.cal{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:12px}
.cal label{margin:0;font-size:.82rem}
.cal input{width:120px;padding:8px 12px;border-radius:99px;font-size:.9rem}
.cal button{all:unset;cursor:pointer;padding:9px 16px;border-radius:99px;font-weight:600;font-size:.82rem;background:linear-gradient(135deg,#fff,#C9D3EA);color:#0A1222}
.cal button.r{background:none;color:var(--mute);border:1px solid var(--line)}
.cal button:focus-visible{outline:2px solid var(--opal)}
.cal .cn{font-size:.8rem;color:var(--mute)}
.crb{all:unset;position:absolute;top:10px;right:76px;z-index:5;cursor:pointer;padding:7px 14px;border-radius:99px;font-size:.78rem;font-weight:600;background:rgba(10,18,34,.78);color:var(--ink);border:1px solid var(--line)}
.crb:hover{border-color:rgba(168,194,240,.6)}
.crb:focus-visible{outline:2px solid var(--opal)}
.chh{position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:5;pointer-events:none;padding:6px 14px;border-radius:99px;font-size:.78rem;color:var(--mute);background:rgba(10,18,34,.78);border:1px solid var(--line);transition:opacity .3s;white-space:nowrap}
.chh.off{opacity:0}
.chartbox.act{border-color:rgba(168,194,240,.55)}
html,body{touch-action:manipulation}
.lg2{display:flex;gap:4px;padding:4px;border-radius:99px;background:rgba(0,0,0,.25);margin-left:14px}
.lg2 button{all:unset;cursor:pointer;padding:6px 12px;border-radius:99px;font-size:.8rem;font-weight:600;color:var(--mute)}
.lg2 button.a{background:linear-gradient(135deg,#fff,#C9D3EA);color:#0A1222}
.lg2 button:focus-visible{outline:2px solid var(--opal)}
nav .wrap>div:last-child{display:flex;align-items:center}
#fxbar{position:relative;z-index:1;border-bottom:1px solid var(--line);min-height:46px;overflow:hidden}
#fxbar .mq{overflow:hidden}#fxbar .mq>div{display:flex;width:max-content;padding:13px 0;animation:mq 45s linear infinite;font-variant-numeric:tabular-nums;font-size:.9rem;color:var(--mute)}
#fxbar .mq span{padding-right:38px}#fxbar .mq b{color:var(--ink);font-weight:600}
@keyframes mq{to{transform:translateX(-50%)}}
.nwtop{display:flex;flex-wrap:wrap;gap:14px;justify-content:space-between;align-items:center;margin-bottom:18px}
.nwtop .tabs button{padding:9px 14px}
.imps{display:flex;gap:8px;flex-wrap:wrap}
.imps button{all:unset;cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:99px;border:1px solid var(--line);font-size:.85rem;color:var(--mute)}
.imps button.on{color:var(--ink);background:rgba(205,218,245,.1)}
.imps button:focus-visible{outline:2px solid var(--opal)}
.di{position:relative;flex:none;width:10px;height:10px;border-radius:50%;display:inline-block;background:#fff}
.i-High{background:#ff4d4d;box-shadow:0 0 10px rgba(255,77,77,.9)}
.i-Medium{background:#FFD83D;box-shadow:0 0 9px rgba(255,216,61,.7)}
.i-Low{background:#fff;box-shadow:0 0 8px rgba(255,255,255,.55)}
.i-High::after,.i-Medium::after{content:"";position:absolute;inset:0;border-radius:50%;background:inherit;animation:ping 1.6s ease-out infinite}
.i-Medium::after{animation-duration:2.6s;opacity:.7}
@keyframes ping{to{transform:scale(3.2);opacity:0}}
.nwlist{border:1px solid var(--line);border-radius:28px;background:linear-gradient(160deg,rgba(205,218,245,.08),rgba(205,218,245,.02));padding:8px 8px}
.ev{display:grid;grid-template-columns:64px 14px 1fr 84px 84px 84px 112px;gap:12px;align-items:center;padding:13px 18px;border-top:1px solid var(--line);font-size:.93rem;font-variant-numeric:tabular-nums}
.ev:first-child{border-top:0}.ev.hd{color:var(--mute);font-size:.8rem;border-top:0}
.ev3{display:contents}.ev3 i{font-style:normal;color:var(--mute);text-align:right}.ev .ac{color:var(--ink);font-weight:600}
.ev .es{text-align:right;color:var(--mute);font-size:.85rem}.ev.done{opacity:.6}.ev.High .en{font-weight:600}
.nm{padding:26px;color:var(--mute);text-align:center}.nm a{text-decoration:underline}
.nsrc{margin-top:12px;color:var(--mute);font-size:.82rem}
/* ---- lajmet: më shumë jetë ---- */
.ev{position:relative;border-radius:14px;transition:background .25s,transform .25s;animation:evin .55s cubic-bezier(.2,.8,.2,1) backwards;animation-delay:calc(var(--i,0)*55ms)}
.ev.hd{animation:none}
@keyframes evin{from{opacity:0;transform:translateY(12px)}}
.ev:not(.hd):hover{background:rgba(205,218,245,.07);transform:translateX(5px)}
.ev.High{background:linear-gradient(90deg,rgba(255,77,77,.12),transparent 60%);box-shadow:inset 3px 0 0 #ff4d4d}
.ev.Medium{background:linear-gradient(90deg,rgba(255,216,61,.09),transparent 55%);box-shadow:inset 3px 0 0 #FFD83D}
.ev.Low{box-shadow:inset 2px 0 0 rgba(255,255,255,.4)}
.ev.High:hover{background:linear-gradient(90deg,rgba(255,77,77,.2),rgba(205,218,245,.04))}
.ev.next{animation:evin .55s cubic-bezier(.2,.8,.2,1) backwards,nxg 2.4s ease-in-out infinite;animation-delay:calc(var(--i,0)*55ms),0s}
@keyframes nxg{50%{box-shadow:inset 3px 0 0 #fff,0 0 28px -8px rgba(168,194,240,.8)}}
.nt{margin-left:10px;font-size:.66rem;letter-spacing:.08em;padding:2px 8px;border-radius:99px;background:linear-gradient(135deg,#fff,#C9D3EA);color:#0A1222;font-weight:700;vertical-align:middle;display:inline-block;animation:ntb 1.6s ease-in-out infinite}
@keyframes ntb{50%{transform:scale(1.1)}}
.ev .es.s60{color:#FFD83D}.ev .es.s15{color:#ff6b6b;font-weight:600;animation:ntb 1.2s ease-in-out infinite}
.ev .es.rel{color:#9AD9BF}.ev .es.rel::before{content:"✓ "}
.ev .ac.has{animation:acp .6s cubic-bezier(.2,.8,.2,1)}
@keyframes acp{from{opacity:0;transform:scale(1.4)}}
.nowrow{display:flex;align-items:center;gap:14px;padding:6px 18px;color:#8fd3ff;font-size:.75rem;font-weight:700;letter-spacing:.14em;animation:evin .5s backwards}
.nowrow i{flex:1;height:2px;border-radius:2px;background:linear-gradient(90deg,transparent,#8fd3ff);position:relative;overflow:hidden}
.nowrow i:last-child{background:linear-gradient(270deg,transparent,#8fd3ff)}
.nowrow i::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,#fff,transparent);transform:translateX(-100%);animation:nsw 2.4s linear infinite}
@keyframes nsw{to{transform:translateX(100%)}}
.nowrow span{display:flex;align-items:center;gap:8px;white-space:nowrap}
.nowrow span::before{content:"";width:8px;height:8px;border-radius:50%;background:#8fd3ff;box-shadow:0 0 12px #8fd3ff;animation:ntb 1.4s ease-in-out infinite}
.nxt{position:relative;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:14px 24px;margin-bottom:16px;padding:18px 24px 24px;border-radius:24px;border:1px solid var(--line);background:linear-gradient(160deg,rgba(205,218,245,.09),rgba(205,218,245,.02));overflow:hidden;animation:evin .6s backwards;transition:border-color .4s}
.nxt.off{display:none}
.nxt .nl{display:flex;align-items:center;gap:14px;min-width:0}
.nxt .nl .di{width:14px;height:14px}
.nxt .nl small{display:block;color:var(--mute);font-size:.78rem;letter-spacing:.04em}
.nxt .nl b{font-weight:600;font-size:1.05rem}
.nxt .nc{text-align:right}
.nxt .nc span{font-family:var(--serif);font-size:clamp(2rem,5vw,2.8rem);line-height:1;font-variant-numeric:tabular-nums}
.nxt .nc small.wn{display:none;color:#ff6b6b;font-weight:600;font-size:.8rem}
.nxt .nb{position:absolute;left:0;right:0;bottom:0;height:4px;background:rgba(0,0,0,.3)}
.nxt .nb u{display:block;height:100%;width:0;background:linear-gradient(90deg,#8fa6dc,#fff);transition:width 1s linear;text-decoration:none}
.nxt.High .nb u{background:linear-gradient(90deg,#ff8a8a,#ff4d4d)}
.nxt.Medium .nb u{background:linear-gradient(90deg,#ffe98a,#FFD83D)}
.nxt.soon{border-color:rgba(255,216,61,.55)}
.nxt.hot{border-color:rgba(255,77,77,.7);background:linear-gradient(160deg,rgba(255,77,77,.16),rgba(255,77,77,.03));animation:nhot 1.4s ease-in-out infinite}
.nxt.hot .nc small.wn{display:block}
@keyframes nhot{50%{box-shadow:0 0 44px -10px rgba(255,77,77,.7)}}
.imps button{transition:.25s}.imps button:hover{transform:translateY(-2px)}
.imps button .ct{min-width:20px;padding:0 6px;border-radius:99px;background:rgba(255,255,255,.1);font-size:.75rem;text-align:center;color:var(--ink)}
.imps button[data-k=High].on{border-color:rgba(255,77,77,.6);background:rgba(255,77,77,.12)}
.imps button[data-k=Medium].on{border-color:rgba(255,216,61,.55);background:rgba(255,216,61,.1)}
.imps button[data-k=Low].on{border-color:rgba(255,255,255,.5);background:rgba(255,255,255,.08)}
.imps button:not(.on) .di{opacity:.35}
.dc{display:inline-flex;align-items:center;gap:6px;margin-left:8px;font-size:.8rem}
.sk{display:grid;gap:10px;padding:14px 18px}
.sk i{display:block;height:44px;border-radius:14px;background:linear-gradient(100deg,rgba(205,218,245,.05) 30%,rgba(205,218,245,.14) 50%,rgba(205,218,245,.05) 70%) 0 0/200% 100%;animation:skm 1.4s linear infinite}
@keyframes skm{to{background-position:-200% 0}}
@media(prefers-reduced-motion:reduce){.ev,.ev.next,.nt,.nowrow,.nowrow i::after,.nxt,.nxt.hot,.di::after,.sk i,.ev .es.s15,.ev .ac.has{animation:none!important}}
@media(max-width:700px){.ev{grid-template-columns:52px 12px 1fr}.ev.hd .ev3,.ev.hd .es{display:none}
 .ev3,.ev .es{display:flex;grid-column:3;gap:16px;justify-content:flex-start}.ev3 i{text-align:left}.ev3 i::before{content:attr(data-l)': ';opacity:.7}.ev .es{text-align:left}
 nav ul li:nth-child(2){display:none}.lg2{margin-left:8px}}
`;

function init(){
const $=id=>document.getElementById(id);
const st=document.createElement('style');st.textContent=CSS;document.head.appendChild(st);
new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')proc(m.target);else m.addedNodes.forEach(n=>n.nodeType===3?proc(n):n.nodeType===1&&walk(n))}})
 .observe(document.body,{childList:true,subtree:true,characterData:true});
if('IntersectionObserver'in window){const cb=document.querySelector('.chartbox');cb&&new IntersectionObserver(e=>{chartVis=e[0].isIntersecting}).observe(cb)}

/* --- nav: lajmet + gjuha --- */
const navw=document.querySelector('nav .wrap'),ul=navw.querySelector('ul');
ul.insertBefore(Object.assign(document.createElement('li'),{innerHTML:'<a href="#lajmet">Lajmet</a>'}),ul.children[3]);
const lw=document.createElement('div');lw.innerHTML='<div class="lg2" role="group" aria-label="Language"><button data-l="sq">SQ</button><button data-l="en">EN</button></div>';
navw.appendChild(lw);
lw.querySelectorAll('button').forEach(b=>b.onclick=()=>setLang(b.dataset.l));

/* --- karuseli i çifteve forex --- */
const bar=document.createElement('div');bar.id='fxbar';document.querySelector('nav').insertAdjacentElement('afterend',bar);
async function fallback(){try{const d=(await (await fetch('https://open.er-api.com/v6/latest/USD')).json()).rates;
 const P=[['EUR/USD',1/d.EUR],['GBP/USD',1/d.GBP],['USD/JPY',d.JPY],['AUD/USD',1/d.AUD],['USD/CAD',d.CAD],['USD/CHF',d.CHF],['NZD/USD',1/d.NZD],['EUR/GBP',d.GBP/d.EUR],['EUR/JPY',d.JPY/d.EUR],['GBP/JPY',d.JPY/d.GBP]];
 const h=P.map(([n,v])=>`<span><b>${n}</b> ${v.toFixed(n.includes('JPY')?3:5)}</span>`).join('');
 bar.innerHTML=`<div class="mq"><div>${h}${h}</div></div>`}catch(e){}}
function tape(){
 const c=document.createElement('div');c.className='tradingview-widget-container';
 c.innerHTML='<div class="tradingview-widget-container__widget"></div>';
 const s=document.createElement('script');s.async=true;s.src='https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
 s.onerror=fallback;
 s.innerHTML=JSON.stringify({symbols:['EURUSD','GBPUSD','USDJPY','AUDUSD','USDCAD','USDCHF','NZDUSD','EURGBP','EURJPY','GBPJPY'].map(x=>({proName:'FX:'+x,title:x.slice(0,3)+'/'+x.slice(3)})).concat([{proName:'OANDA:XAUUSD',title:'XAU/USD'}]),showSymbolLogo:false,colorTheme:'dark',isTransparent:true,displayMode:'adaptive',locale:'en'});
 c.appendChild(s);bar.appendChild(c);
 setTimeout(()=>{if(!bar.querySelector('iframe')&&!bar.querySelector('.mq'))fallback()},8000)}
document.readyState==='complete'?tape():addEventListener('load',()=>setTimeout(tape,300));

/* --- burimi i grafikut --- */
const src=document.querySelector('.src');
const setSrc=()=>{if(src)src.textContent=L('XAU live · PAXG/USDT i kalibruar me çmimin spot të arit','XAU live · PAXG/USDT calibrated to the spot gold price')};

/* --- kalibrim me MT5 --- */
if(src){const cal=document.createElement('div');cal.className='cal';
 cal.innerHTML='<label for="mt5" id="mt5l"></label><input id="mt5" type="number" step="any" inputmode="decimal" placeholder="3874.00"><button type="button" id="mt5b"></button><button type="button" class="r" id="mt5r"></button><span class="cn" id="mt5n"></span>';
 src.insertAdjacentElement('afterend',cal);
 const calL=()=>{$('mt5l').textContent=L('Çmimi në MT5:','Price on MT5:');$('mt5b').textContent=L('Kalibro','Calibrate');$('mt5r').textContent=L('Hiq','Reset');
  $('mt5n').textContent=MAN?L('Diferenca e ruajtur: ','Saved difference: ')+(MAN>0?'+':'')+MAN.toFixed(2)+'$':''};
 const cur=()=>parseFloat($('px').textContent.replace(/,/g,''))||0;
 $('mt5b').onclick=()=>{const m=parseFloat($('mt5').value),c=cur();if(!(m>0)||!(c>0))return;MAN=setMan(MAN+(m-c));$('mt5').value='';calL();reloadChart()};
 $('mt5r').onclick=()=>{MAN=setMan(0);calL();reloadChart()};
 $('mt5').addEventListener('keydown',e=>{if(e.key==='Enter')$('mt5b').click()});
 window.addEventListener('langchange',calL);calL()}

/* --- lajmet USD --- */
const sec=document.createElement('section');sec.id='lajmet';
sec.innerHTML='<h2 id="nh"></h2><p class="sub" id="ns"></p><div class="nwtop"><div class="tabs" id="nd"></div><div class="imps" id="ni"></div></div><div class="nxt off" id="nn"></div><div class="nwlist" id="nw"></div><p class="nsrc" id="nf"></p>';
const calc=$('llogaritesit');calc.parentNode.insertBefore(sec,calc);
let EV=[],day=null,LOAD=true;const DBG=[];const imp={High:1,Medium:1,Low:1},tz='Europe/Tirane';
const dk=d=>new Date(d).toLocaleDateString('en-CA',{timeZone:tz});
const IL=()=>({High:L('I lartë','High'),Medium:L('Mesatar','Medium'),Low:L('I ulët','Low')});
function status(e){const ms=e.t-Date.now();if(ms<=0)return L('Doli','Released');
 const m=Math.round(ms/6e4),h=Math.floor(m/60),d=Math.floor(h/24);
 return L('Pas ','In ')+(d?`${d}d ${h%24}h`:h?`${h}h ${m%60}min`:`${m}min`)}
const cd=ms=>{const t=Math.max(0,Math.floor(ms/1e3)),d=Math.floor(t/86400),h=Math.floor(t%86400/3600),m=Math.floor(t%3600/60),x=t%60,p=n=>String(n).padStart(2,'0');return(d?d+'d ':'')+p(h)+':'+p(m)+':'+p(x)};
const NX=()=>{const n=Date.now(),up=EV.filter(e=>+e.t>n&&imp[e.impact]!==0),hi=up.find(e=>e.impact==='High');return hi||up[0]||null};
function nxCls(e,ms){const hot=e.impact==='High'&&ms<=30*6e4,soon=ms<=60*6e4;return'nxt '+e.impact+(hot?' hot':soon?' soon':'')}
function renderNext(){
 const nn=$('nn');if(!nn)return;
 const e=EV.length?NX():null;
 if(!e){delete nn.dataset.t;nn.className='nxt off';nn.innerHTML='';return}
 const ms=+e.t-Date.now();
 nn.dataset.t=+e.t;nn.dataset.i=e.impact;nn.className=nxCls(e,ms);
 nn.innerHTML=`<div class="nl"><span class="di i-${e.impact}"></span><div><small>${L('Lajmi i radhës','Next news')} · ${IL()[e.impact]}</small><b>${e.title}</b></div></div><div class="nc"><span id="nct">${cd(ms)}</span><small class="wn">${L('Mos hap trade tani','Do not open trades now')}</small></div><i class="nb"><u id="nbu"></u></i>`;
 tickNext()}
function tickNext(){
 const nn=$('nn');if(!nn||!nn.dataset.t)return;
 const ms=+nn.dataset.t-Date.now();
 if(ms<=0){renderNews();return}
 const c=$('nct');if(c)c.textContent=cd(ms);
 const u=$('nbu');if(u)u.style.width=(Math.min(1,Math.max(0,1-ms/(4*36e5)))*100)+'%';
 nn.className=nxCls({impact:nn.dataset.i},ms)}
function renderNews(){
 $('nh').textContent=L('Lajmet USD','USD news');
 $('ns').textContent=L('Kalendari ekonomik i USD për çdo ditë me nivelin e ndikimit. Orët janë sipas Tiranës.','Daily USD economic calendar with impact level. Times are Tirana time.');
 $('nf').innerHTML=L('Burimi: Forex Factory. Kolona Rezultati mbushet sapo burimi e publikon vlerën.','Source: Forex Factory. The Result column fills in once the source publishes the value.');
 $('ni').innerHTML=Object.entries(IL()).map(([k,t])=>`<button class="${imp[k]?'on':''}" data-k="${k}" aria-pressed="${!!imp[k]}"><span class="di i-${k}"></span>${t}<span class="ct" data-c="${k}"></span></button>`).join('');
 $('ni').querySelectorAll('button').forEach(b=>b.onclick=()=>{imp[b.dataset.k]=imp[b.dataset.k]?0:1;renderNews()});
 const box=$('nw');
 if(!EV.length){renderNext();$('nd').innerHTML='';box.innerHTML=LOAD?`<div class="sk"><i></i><i></i><i></i><i></i><i></i></div>`:`<p class="nm">${L('Lajmet nuk u ngarkuan. ','News could not be loaded. ')}<a href="#" id="nretry">${L('Provo përsëri','Try again')}</a> · <a href="https://www.forexfactory.com/calendar" target="_blank" rel="noopener">Forex Factory</a></p>${DBG.length?`<p class="nm" style="padding-top:0;font-size:.8rem">${DBG.join(' · ')}</p>`:''}`;const r=$('nretry');r&&(r.onclick=e=>{e.preventDefault();loadNews(true)});return}
 const days=[...new Set(EV.map(e=>dk(e.t)))],today=dk(new Date());
 if(!day||!days.includes(day))day=days.includes(today)?today:(days.find(d=>d>today)||days[0]);
 $('nd').innerHTML=days.map(d=>{const dt=new Date(d+'T12:00:00Z'),hi=EV.filter(e=>dk(e.t)===d&&e.impact==='High').length;
  return `<button role="tab" aria-selected="${d===day}" data-d="${d}">${dt.toLocaleDateString(lang==='en'?'en-GB':'sq-AL',{weekday:'short',day:'numeric',timeZone:'UTC'})}${hi?` <span class="dc"><i class="di i-High"></i>${hi}</span>`:''}</button>`}).join('');
 $('nd').querySelectorAll('button').forEach(b=>b.onclick=()=>{day=b.dataset.d;renderNews()});
 ['High','Medium','Low'].forEach(k=>{const c=document.querySelector('#ni [data-c="'+k+'"]');if(c)c.textContent=EV.filter(e=>dk(e.t)===day&&e.impact===k).length});
 renderNext();
 const rows=EV.filter(e=>dk(e.t)===day&&imp[e.impact]!==0&&(imp[e.impact]!==undefined||imp.Low));
 const hd=`<div class="ev hd"><span>${L('Koha','Time')}</span><span></span><span>${L('Ngjarja','Event')}</span><span class="ev3"><i>${L('Para','Previous')}</i><i>${L('Parashikim','Forecast')}</i><i>${L('Rezultati','Result')}</i></span><span class="es" style="text-align:right">${L('Statusi','Status')}</span></div>`;
 const nowT=Date.now(),isToday=day===dk(new Date()),nxt=rows.find(e=>+e.t>nowT);
 const nowRow=`<div class="nowrow"><i></i><span>${L('TANI','NOW')} · <u id="nowt" style="text-decoration:none">${new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit'})}</u></span><i></i></div>`;
 let marked=false;
 box.innerHTML=hd+(rows.length?rows.map((e,i)=>{
  let pre='';if(isToday&&!marked&&+e.t>nowT){marked=true;pre=nowRow}
  return pre+`<div class="ev ${e.impact} ${e.t<nowT?'done':''} ${e===nxt?'next':''}" style="--i:${i}"><span>${e.t.toLocaleTimeString('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit'})}</span><span class="di i-${e.impact}" title="${IL()[e.impact]||''}"></span><span class="en">${e.title}${e===nxt?`<b class="nt">${L('I RADHËS','NEXT')}</b>`:''}</span><span class="ev3"><i data-l="${L('Para','Prev')}">${e.previous||'—'}</i><i data-l="${L('Parashikim','Fcst')}">${e.forecast||'—'}</i><i class="ac${e.actual?' has':''}" data-l="${L('Rezultati','Result')}">${e.actual||'—'}</i></span><span class="es" data-t="${+e.t}"></span></div>`}).join('')+(isToday&&!marked?nowRow:''):`<p class="nm">${L('Asnjë lajm USD për këtë filtër.','No USD news for this filter.')}</p>`);
 tickNews()}
function tickNews(){const n=Date.now();
 document.querySelectorAll('#nw .es[data-t]').forEach(s=>{const ms=+s.dataset.t-n;s.textContent=status({t:+s.dataset.t});s.className='es'+(ms<=0?' rel':ms<=15*6e4?' s15':ms<=60*6e4?' s60':'')});
 const w=$('nowt');if(w)w.textContent=new Date().toLocaleTimeString('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit'})}
setInterval(tickNews,15000);setInterval(tickNext,1000);

/* Burimi i lajmeve: provon disa rrugë, me timeout dhe kopje të ruajtur */
const FFU='https://nfs.faireconomy.media/ff_calendar_thisweek.json';
const W='https://lajmet.santiagoredhaj5.workers.dev'; /* Zëvendëso me adresën e Worker-it tënd nga Cloudflare */
function setEV(d){EV=d.filter(e=>e.country==='USD').map(e=>Object.assign({},e,{t:new Date(e.date)})).filter(e=>!isNaN(e.t)).sort((a,b)=>a.t-b.t)}
const shortU=x=>x.replace(/^https?:\/\//,'').split('/')[0]||x;
async function pull(x){const c=new AbortController(),t=setTimeout(()=>c.abort(),7000);
 try{const r=await fetch(x,{signal:c.signal});
  if(!r.ok){DBG.push(shortU(x)+': '+r.status);return null}
  const d=await r.json();
  if(Array.isArray(d)&&d.length)return d;
  DBG.push(shortU(x)+': '+(Array.isArray(d)?'empty':'not a list'));return null}
 catch(e){DBG.push(shortU(x)+': '+(e.name==='AbortError'?'timeout':'blocked'));return null}
 finally{clearTimeout(t)}}
async function loadNews(force){
 let ts=0;try{ts=+localStorage.getItem('ffct')||0}catch(e){}
 if(!force&&EV.length&&Date.now()-ts<3e5)return;
 DBG.length=0;const q=encodeURIComponent(FFU);
 const list=['/.netlify/functions/news',...(W.includes('ADRESA-JOTE')?[]:[W]),FFU,'https://corsproxy.io/?'+q,'https://api.allorigins.win/raw?url='+q,'https://api.codetabs.com/v1/proxy?quest='+q];
 let d=null;for(const x of list){d=await pull(x);if(d)break}
 if(d){try{localStorage.setItem('ffc',JSON.stringify(d));localStorage.setItem('ffct',Date.now())}catch(e){}setEV(d)}
 LOAD=false;renderNews()}
try{const c=JSON.parse(localStorage.getItem('ffc'));if(Array.isArray(c)){setEV(c);if(EV.length)LOAD=false}}catch(e){}
renderNews();loadNews();setInterval(loadNews,6e5);

/* --- valuta EUR + lot maksimal teorik --- */
const inst=document.querySelector('.inst');
inst.insertAdjacentHTML('beforeend','<div style="min-width:150px"><label for="ccy" id="ccyl"></label><select id="ccy"><option value="USD">USD ($)</option><option value="EUR">EUR (€)</option></select></div>');
const ccy=$('ccy');let FX=0;
$('o3c').parentElement.insertAdjacentHTML('afterend','<div class="row"><span id="o3dl"></span><span id="o3d">—</span></div><div class="row"><span id="o3el"></span><span id="o3e">—</span></div>');
function labels(){
 const c=ccy.value;
 $('ccyl').textContent=L('Valuta e llogarisë','Account currency')+(FX?` · 1€ = ${FX.toFixed(4)}$`:'');
 document.querySelector('label[for=e3]').textContent=L(`Balanca (${c}, opsionale)`,`Balance (${c}, optional)`);
 document.querySelector('label[for=a4]').textContent=L(`Balanca (${c})`,`Balance (${c})`);
 $('o3dl').textContent=L('Lot maksimal teorik','Maximum theoretical lots');
 $('o3el').textContent=L('Pozicioni maksimal (nominal)','Maximum position (notional)')}
async function fx(){
 for(const [u,f] of [['https://api.binance.com/api/v3/ticker/price?symbol=EURUSDT',j=>+j.price],['https://open.er-api.com/v6/latest/EUR',j=>j.rates.USD]]){
  try{const r=await fetch(u);if(r.ok){const v=f(await r.json());if(v>0){FX=v;break}}}catch(e){}}
 labels()}
fx();setInterval(fx,3e4);
const eur=()=>ccy.value==='EUR'&&FX>0;
const kept={};
ccy.onchange=()=>{document.querySelectorAll('.pane .out').forEach(o=>o.classList.add('stale'));$('o3d').textContent=$('o3e').textContent='—';labels()};
$('p3').addEventListener('input',()=>{$('o3d').textContent=$('o3e').textContent='—'});
function pre(p){if(!eur())return;const id=p==='p3'?'e3':p==='p4'?'a4':null;if(!id)return;const el=$(id);kept[id]=el.value;el.value=String((parseFloat(el.value)||0)*FX)}
function post(p){
 const id=p==='p3'?'e3':p==='p4'?'a4':null;if(id&&id in kept){$(id).value=kept[id];delete kept[id]}
 const E=eur();
 if(E)document.querySelectorAll('#'+p+' .out .big,#'+p+' .out .row span:last-child,#'+p+' .out .note').forEach(el=>{
  el.textContent=el.textContent.replace(/(-?)\$([\d,]+\.\d{2})/g,(m,s,n)=>s+'€'+(parseFloat(n.replace(/,/g,''))/FX).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}))});
 if(p==='p3'){
  const i=I(),pr=v('b3'),Lv=+lev.value,bal=(parseFloat($('e3').value)||0)*(E?FX:1),per=i.q==='base'?i.c:i.c*pr;
  if(bal>0&&per>0&&Lv>0){const ml=Math.floor(bal*Lv/per*100)/100,nt=ml*per,f=x=>(E?'€':'$')+(E?x/FX:x).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
   $('o3d').textContent=num(ml,2)+' lot';$('o3e').textContent=f(nt)}
  else $('o3d').textContent=$('o3e').textContent='—'}}
const runOf=t=>{const b=t.closest&&t.closest('[data-run]');return b?b.dataset.run:null},
 paneOf=t=>{const q=t.closest&&t.closest('.pane');return q&&t.closest('input,select')?q.id:null};
document.addEventListener('click',e=>{const p=runOf(e.target);p&&pre(p)},true);
document.addEventListener('click',e=>{const p=runOf(e.target);p&&post(p)});
document.addEventListener('keydown',e=>{if(e.key==='Enter'){const p=paneOf(e.target);p&&pre(p)}},true);
document.addEventListener('keydown',e=>{if(e.key==='Enter'){const p=paneOf(e.target);p&&post(p)}});

window.addEventListener('langchange',()=>{renderNews();labels();setSrc()});
labels();setSrc();
if(lang==='en')setLang('en');else document.querySelectorAll('.lg2 button').forEach(b=>b.classList.toggle('a',b.dataset.l==='sq'));

/* --- grafiku: zoom vetëm pasi e klikon, buton reset, pa zmadhim të faqes --- */
(()=>{
 const cb=document.querySelector('.chartbox');if(!cb)return;
 cb.insertAdjacentHTML('beforeend','<button type="button" class="crb" id="crb"></button><div class="chh" id="chh"></div>');
 const rb=$('crb'),hint=$('chh');let CHACT=false,CH=null;
 const lab=()=>{hint.textContent=L('Kliko grafikun për të zmadhuar','Click the chart to zoom');hint.classList.toggle('off',CHACT);rb.textContent=L('Reset grafiku','Reset chart')};
 const lock=()=>{if(CH){try{CH.applyOptions(CHACT
   ?{handleScroll:{mouseWheel:true,pressedMouseMove:true,horzTouchDrag:true,vertTouchDrag:false},handleScale:{mouseWheel:true,pinch:true,axisPressedMouseMove:true}}
   :{handleScroll:false,handleScale:false})}catch(e){}}
  cb.classList.toggle('act',CHACT);lab()};
 setInterval(()=>{const c=window.__ch&&window.__ch.chart();if(c&&c!==CH){CH=c;lock()}},200);
 document.addEventListener('click',e=>{const inb=!!(e.target.closest&&e.target.closest('.chartbox'));if(inb!==CHACT){CHACT=inb;lock()}});
 cb.addEventListener('mouseleave',()=>{if(CHACT&&matchMedia('(hover:hover)').matches){CHACT=false;lock()}});
 rb.addEventListener('click',()=>{if(!CH)return;try{CH.priceScale('right').applyOptions({autoScale:true});CH.timeScale().fitContent()}catch(e){}});
 window.addEventListener('langchange',lab);lab();
 /* mos lejo zmadhimin e faqes me dy gishta */
 ['gesturestart','gesturechange','gestureend'].forEach(t=>document.addEventListener(t,e=>e.preventDefault(),{passive:false}));
 document.addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault()},{passive:false});
 document.addEventListener('touchmove',e=>{if(e.touches.length>1&&!(CHACT&&e.target.closest&&e.target.closest('.chartbox')))e.preventDefault()},{passive:false});
 const vp=document.querySelector('meta[name=viewport]');
 vp&&vp.setAttribute('content','width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
})();

/* analiza: mos e rillogarit çdo sekondë */
(()=>{const o=window.onBars;if(typeof o!=='function')return;let lt=0,ltf='';
 window.onBars=(b,tf)=>{const n=Date.now();if(tf!==ltf||n-lt>15000){ltf=tf;lt=n;o(b,tf)}}})();
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
