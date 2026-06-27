import { useState, useEffect, useRef } from "react";

// ── Logo placeholder (replaced at build) ─────────────────────────────────────
const LOGO_B64 = "";

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#0D0F0A", surface:"#141710", card:"#1A1E14", border:"#2A3020",
  accent:"#8BEA00", accentDark:"#5AAA00", accentText:"#0D1A00",
  green:"#4ADE80", red:"#EF4444", yellow:"#EAB308",
  blue:"#3B82F6", purple:"#A855F7", orange:"#F97316",
  textPrimary:"#F0F7E0", textSecondary:"#8FA870", textMuted:"#4A5E30",
};

// ── Lugares ───────────────────────────────────────────────────────────────────
// INDEPENDENCIA: Parque Independencia L/M/X/J 19:30 + L/X/V 09:00
// MERCADO:       Mercado del Patio    M/J 17:30
const LUGAR = { IND:"independencia", MER:"mercado" };

// Planes de asistencia configurables
const PLANES = [
  { id:"man2", label:"Mañana 2 días",  lugar:LUGAR.IND, diasSemana:[1,3],   horaLabel:"09:00hs L/X",   cuota:33000 },
  { id:"man3", label:"Mañana 3 días",  lugar:LUGAR.IND, diasSemana:[1,3,5], horaLabel:"09:00hs L/X/V", cuota:33000 },
  { id:"ind2", label:"Tarde 2 días",   lugar:LUGAR.IND, diasSemana:[1,2],   horaLabel:"19:30hs L/Ma",  cuota:33000 },
  { id:"ind3", label:"Tarde 3 días",   lugar:LUGAR.IND, diasSemana:[1,2,3], horaLabel:"19:30hs L/Ma/X",cuota:33000 },
  { id:"ind4", label:"Tarde 4 días",   lugar:LUGAR.IND, diasSemana:[1,2,3,4],horaLabel:"19:30hs L/Ma/X/J",cuota:33000 },
  { id:"mer2", label:"Mercado 2 días", lugar:LUGAR.MER, diasSemana:[2,4],   horaLabel:"17:30hs Ma/J",  cuota:28000 },
];
const planInfo = id => PLANES.find(p=>p.id===id)||PLANES[0];

// Días semana disponibles por plan (para contar días posibles en un mes)
const diasPosiblesEnMes = (planId, mesISO) => {
  const plan = planInfo(planId);
  const [y,m] = mesISO.split("-").map(Number);
  const diasMes = new Date(y,m,0).getDate();
  let count=0;
  for(let d=1;d<=diasMes;d++){
    const dow=new Date(y,m-1,d).getDay();
    if(plan.diasSemana.includes(dow)) count++;
  }
  return count;
};

const diasPosiblesHastaHoy = (planId, mesISO) => {
  const plan = planInfo(planId);
  const [y,m] = mesISO.split("-").map(Number);
  const hoyDate=new Date();
  const finMes=new Date(y,m,0);
  const limite=hoyDate<finMes?hoyDate:finMes;
  let count=0;
  const d=new Date(y,m-1,1);
  while(d<=limite){ if(plan.diasSemana.includes(d.getDay())) count++; d.setDate(d.getDate()+1); }
  return count;
};

// ── Premios por antigüedad ─────────────────────────────────────────────────
const PREMIOS = [
  { meses:3,  label:"Plancha Stickers",      emoji:"🏷️",  color:C.accent },
  { meses:6,  label:"Llavero",               emoji:"🔑",  color:C.yellow },
  { meses:9,  label:"Lanyard",               emoji:"🪢",  color:C.orange },
  { meses:12, label:"Bolsa Jump + Colchoneta",emoji:"🎒", color:C.blue   },
  { meses:16, label:"Toalla",                emoji:"🧻",  color:C.purple },
  { meses:20, label:"Medias",                emoji:"🧦",  color:C.red    },
  { meses:24, label:"Botella",               emoji:"🍶",  color:C.green  },
  { meses:36, label:"Remera",                emoji:"👕",  color:C.accent },
  { meses:48, label:"Mochila + Colchoneta",  emoji:"🎒",  color:C.yellow },
];
const premioActual = meses => [...PREMIOS].reverse().find(p=>meses>=p.meses)||null;
const proximoPremio = meses => PREMIOS.find(p=>meses<p.meses)||null;

// ── Helpers ───────────────────────────────────────────────────────────────────
const hoy = () => new Date().toISOString().split("T")[0];
const mesActual = () => hoy().slice(0,7);
const fmtFecha = iso => { try{ const[y,m,d]=iso.split("-"); return `${d}/${m}/${y}`; }catch{ return iso; } };
const fmtMes = iso => { const[y,m]=iso.split("-"); const names=["","Ene","Feb","Mar","Apr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]; return `${names[+m]} ${y}`; };
const today = new Date();

// ── Storage ───────────────────────────────────────────────────────────────────
const useLS = (key, init) => {
  const [val,setVal] = useState(()=>{ try{ const s=localStorage.getItem(key); return s?JSON.parse(s):init; }catch{ return init; } });
  const set = v => { const next=typeof v==="function"?v(val):v; setVal(next); try{ localStorage.setItem(key,JSON.stringify(next)); }catch{} };
  return [val,set];
};

// ── Icon ─────────────────────────────────────────────────────────────────────
const Ic = ({p,s=18,c="currentColor"}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={p}/>
  </svg>
);
const I = {
  users:  "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  check:  "M20 6 9 17l-5-5",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  chart:  "M3 3v18h18M18 17V9M12 17V5M6 17v-5",
  bell:   "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  plus:   "M12 5v14M5 12h14",
  x:      "M18 6 6 18M6 6l12 12",
  edit:   "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:  "M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2",
  send:   "M22 2 11 13M22 2 15 22 11 13 2 9l20-7z",
  pin:    "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  qr:     "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM17 17h4v4h-4zM17 14h1M14 17v1",
  trophy: "M8 21h8M12 17v4M17 3H7L5 9c0 3.87 3.13 7 7 7s7-3.13 7-7L17 3zM5 9H3M19 9h2",
  star:   "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  lock:   "M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2zM7 11V7a5 5 0 0 1 10 0v4",
  person: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  medal:  "M12 15a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM8.21 13.89 7 23l5-3 5 3-1.21-9.12",
  cake:   "M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8M4 21h16M12 3v4M8 7c0-2.21 1.79-4 4-4s4 1.79 4 4M2 21h20",
  target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  down:   "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  cal:    "M3 4h18v18H3V4zM16 2v4M8 2v4M3 10h18",
  eye:    "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
};

// ── UI Atoms ──────────────────────────────────────────────────────────────────
const Badge = ({children,color=C.accent,style}) => (
  <span style={{background:color+"22",color,border:`1px solid ${color}44`,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",...style}}>{children}</span>
);
const Btn = ({children,onClick,variant="primary",size="md",disabled,style,title}) => {
  const sz={sm:{padding:"4px 10px",fontSize:12},md:{padding:"8px 16px",fontSize:13},lg:{padding:"12px 24px",fontSize:15}};
  const vr={
    primary:{background:C.accent,color:C.accentText,fontWeight:800},
    ghost:{background:"transparent",color:C.textSecondary,border:`1px solid ${C.border}`},
    danger:{background:C.red+"22",color:C.red,border:`1px solid ${C.red}44`},
    success:{background:C.green+"22",color:C.green,border:`1px solid ${C.green}44`},
    lime:{background:C.accent+"22",color:C.accent,border:`1px solid ${C.accent}44`},
    warn:{background:C.yellow+"22",color:C.yellow,border:`1px solid ${C.yellow}44`},
  };
  return <button title={title} onClick={onClick} disabled={disabled} style={{border:"none",cursor:disabled?"not-allowed":"pointer",borderRadius:8,fontFamily:"inherit",display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?.45:1,transition:"opacity .15s",...sz[size],...vr[variant],...style}}>{children}</button>;
};
const Inp = ({value,onChange,placeholder,type="text",style,required}) => (
  <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}
    style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPrimary,padding:"8px 12px",fontSize:14,fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box",...style}}/>
);
const Sel = ({value,onChange,children,style}) => (
  <select value={value} onChange={e=>onChange(e.target.value)} style={{background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPrimary,padding:"8px 12px",fontSize:14,fontFamily:"inherit",outline:"none",...style}}>{children}</select>
);
const Card = ({children,style,onClick}) => (
  <div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:16,cursor:onClick?"pointer":undefined,...style}}>{children}</div>
);
const Modal = ({title,onClose,children,wide}) => (
  <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16}}>
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:wide?640:480,maxHeight:"92vh",overflow:"auto",padding:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h3 style={{color:C.textPrimary,margin:0,fontSize:17}}>{title}</h3>
        <Btn variant="ghost" size="sm" onClick={onClose}><Ic p={I.x} s={15}/></Btn>
      </div>
      {children}
    </div>
  </div>
);
const Av = ({nombre,size=36}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:C.accent+"22",color:C.accent,fontWeight:800,fontSize:size*.38,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
    {nombre?.charAt(0).toUpperCase()}
  </div>
);
const PlanBadge = ({planId}) => {
  const p=planInfo(planId);
  const col=p.lugar===LUGAR.MER?C.purple:C.blue;
  return <Badge color={col}>{p.label}</Badge>;
};
const LugarBadge = ({planId}) => {
  const p=planInfo(planId);
  return <Badge color={p.lugar===LUGAR.MER?C.purple:C.orange}>{p.lugar===LUGAR.MER?"Mercado":"Independencia"}</Badge>;
};

// ── Circular Progress ─────────────────────────────────────────────────────────
const Ring = ({pct,size=72,color=C.accent}) => {
  const r=28,circ=2*Math.PI*r,dash=(pct/100)*circ;
  return (
    <div style={{position:"relative",width:size,height:size,flexShrink:0}}>
      <svg width={size} height={size} viewBox="0 0 72 72">
        <circle cx={36} cy={36} r={r} fill="none" stroke={C.border} strokeWidth="5"/>
        <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"/>
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
        <div style={{color,fontWeight:800,fontSize:size*.2,lineHeight:1}}>{pct}%</div>
      </div>
    </div>
  );
};

// ── QR Canvas ─────────────────────────────────────────────────────────────────
const QRCanvas = ({value,size=220}) => {
  const ref=useRef();
  useEffect(()=>{
    if(!ref.current||!value) return;
    const cv=ref.current, ctx=cv.getContext("2d");
    cv.width=size; cv.height=size;
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,size,size);
    const cells=25, cell=size/cells;
    let hash=0;
    for(let i=0;i<value.length;i++){ hash=((hash<<5)-hash)+value.charCodeAt(i); hash|=0; }
    const rnd=i=>{ let x=Math.sin(hash+i)*10000; return x-Math.floor(x); };
    const drawCorner=(ox,oy)=>{
      ctx.fillStyle="#111"; ctx.fillRect(ox*cell,oy*cell,7*cell,7*cell);
      ctx.fillStyle="#fff"; ctx.fillRect((ox+1)*cell,(oy+1)*cell,5*cell,5*cell);
      ctx.fillStyle="#111"; ctx.fillRect((ox+2)*cell,(oy+2)*cell,3*cell,3*cell);
    };
    drawCorner(0,0); drawCorner(cells-7,0); drawCorner(0,cells-7);
    let idx=0;
    for(let r=0;r<cells;r++) for(let c=0;c<cells;c++){
      const inC=(r<8&&c<8)||(r<8&&c>cells-9)||(r>cells-9&&c<8);
      if(!inC&&rnd(idx++)>0.5){ ctx.fillStyle="#111"; ctx.fillRect(c*cell,r*cell,cell,cell); }
    }
    // Logo circle in center
    ctx.fillStyle="#8BEA00"; ctx.beginPath(); ctx.arc(size/2,size/2,cell*2.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#0D1A00"; ctx.font=`bold ${Math.round(cell*.9)}px sans-serif`; ctx.textAlign="center";
    ctx.fillText("U",size/2,size/2+cell*.35);
  },[value,size]);
  return <canvas ref={ref} style={{borderRadius:10,display:"block",border:`2px solid ${C.border}`}}/>;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AUTH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const ADMIN_PASS="united2024";

const AuthScreen = ({onLogin,setPendientes,allAlumnos}) => {
  const [tab,setTab]=useState("login");
  const [email,setEmail]=useState(""); const [pass,setPass]=useState("");
  const [nombre,setNombre]=useState(""); const [plan,setPlan]=useState("man3");
  const [tel,setTel]=useState(""); const [objetivo,setObjetivo]=useState("");
  const [cumple,setCumple]=useState(""); const [err,setErr]=useState(""); const [ok,setOk]=useState("");

  const login=()=>{
    setErr("");
    if(email.trim()==="admin"&&pass===ADMIN_PASS){ onLogin({rol:"admin",nombre:"Entrenador"}); return; }
    const a=allAlumnos.find(x=>x.email===email.trim()&&x.pass===pass);
    if(a){ if(!a.aprobado){ setErr("Tu cuenta aún no fue aprobada."); return; } onLogin({rol:"alumno",...a}); }
    else setErr("Email o contraseña incorrectos.");
  };

  const registrar=()=>{
    setErr("");
    if(!nombre.trim()||!email.trim()||!pass.trim()){ setErr("Completá nombre, email y contraseña."); return; }
    if(!objetivo.trim()){ setErr("El objetivo de entrenamiento es obligatorio."); return; }
    if(!cumple){ setErr("La fecha de cumpleaños es obligatoria."); return; }
    if(allAlumnos.find(a=>a.email===email.trim())){ setErr("Ese email ya está registrado."); return; }
    setPendientes(prev=>[...prev,{
      id:Date.now(),nombre:nombre.trim(),email:email.trim(),pass,plan,telefono:tel,
      objetivo:objetivo.trim(),cumpleanos:cumple,aprobado:false,activo:true,
      fechaIngreso:hoy(),antiguedadMeses:0,historialAsistencia:{}
    }]);
    setOk("¡Solicitud enviada! El entrenador va a aprobar tu cuenta pronto.");
  };

  return (
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <img src={`data:image/png;base64,${LOGO_B64}`} alt="United" style={{width:90,height:90,borderRadius:"50%",objectFit:"cover",border:`3px solid ${C.accent}`,marginBottom:16}}/>
      <div style={{fontWeight:900,fontSize:22,color:C.accent,letterSpacing:2}}>UNITED</div>
      <div style={{fontSize:12,color:C.textMuted,letterSpacing:2,marginBottom:24}}>ENTRENAMIENTOS</div>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,width:"100%",maxWidth:380,padding:24}}>
        <div style={{display:"flex",gap:0,marginBottom:18,background:C.bg,borderRadius:8,padding:3}}>
          {[["login","Iniciar sesión"],["reg","Registrarse"]].map(([k,l])=>(
            <button key={k} onClick={()=>{setTab(k);setErr("");setOk("");}}
              style={{flex:1,border:"none",borderRadius:6,padding:"7px 0",cursor:"pointer",fontFamily:"inherit",fontSize:13,fontWeight:700,background:tab===k?C.accent:"transparent",color:tab===k?C.accentText:C.textSecondary}}>
              {l}
            </button>
          ))}
        </div>
        {tab==="login"?(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Inp value={email} onChange={setEmail} placeholder='Email o "admin"'/>
            <Inp type="password" value={pass} onChange={setPass} placeholder="Contraseña"/>
            {err&&<div style={{color:C.red,fontSize:12}}>{err}</div>}
            <Btn onClick={login} size="lg" style={{justifyContent:"center"}}>Entrar</Btn>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <Inp value={nombre} onChange={setNombre} placeholder="Nombre completo *"/>
            <Inp value={email} onChange={setEmail} placeholder="Email *"/>
            <Inp type="password" value={pass} onChange={setPass} placeholder="Contraseña *"/>
            <Inp value={tel} onChange={setTel} placeholder="Teléfono (opcional)"/>
            <div>
              <div style={{color:C.textMuted,fontSize:11,marginBottom:4}}>Plan de asistencia *</div>
              <Sel value={plan} onChange={setPlan}>
                {PLANES.map(p=><option key={p.id} value={p.id}>{p.label} — {p.horaLabel} — ${p.cuota.toLocaleString("es-AR")}/mes</option>)}
              </Sel>
            </div>
            <div>
              <div style={{color:C.textMuted,fontSize:11,marginBottom:4}}>Fecha de cumpleaños *</div>
              <Inp type="date" value={cumple} onChange={setCumple}/>
            </div>
            <div>
              <div style={{color:C.textMuted,fontSize:11,marginBottom:4}}>Tu objetivo de entrenamiento * <span style={{color:C.red}}>obligatorio</span></div>
              <textarea value={objetivo} onChange={e=>setObjetivo(e.target.value)} placeholder="¿Qué querés lograr con el entrenamiento? Ej: bajar de peso, mejorar resistencia, ganar fuerza..."
                style={{width:"100%",minHeight:70,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPrimary,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
            </div>
            {err&&<div style={{color:C.red,fontSize:12}}>{err}</div>}
            {ok&&<div style={{color:C.green,fontSize:12}}>{ok}</div>}
            <Btn onClick={registrar} size="lg" style={{justifyContent:"center"}}>Enviar solicitud</Btn>
          </div>
        )}
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// QR ÚNICO + REGISTRO DE ESCANEO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const detectarTurno = () => {
  const now=new Date(), h=now.getHours(), m=now.getMinutes(), dow=now.getDay();
  const mins=h*60+m;
  // 09:00 L/X/V => planes man2,man3
  if([1,3,5].includes(dow)&&mins>=8*60+30&&mins<=10*60) return "manana";
  // 17:30 M/J => mer2
  if([2,4].includes(dow)&&mins>=17*60&&mins<=19*60) return "mercado";
  // 19:30 L/Ma/X/J => ind2/3/4
  if([1,2,3,4].includes(dow)&&mins>=19*60&&mins<=21*60) return "tarde";
  return "libre";
};

const VistaQR = ({asistencia,setAsistencia,alumnos,usuario}) => {
  const QR_VALUE = "UNITED_ENTRENAMIENTOS_ASISTENCIA_2024";
  const [msg,setMsg]=useState("");
  const [msgColor,setMsgColor]=useState(C.green);

  const marcarPresente=()=>{
    const turnoDetectado=detectarTurno();
    const plan=planInfo(usuario.plan);
    const dow=new Date().getDay();
    // Verificar si hoy le corresponde entrenar según su plan
    const leCorresponde=plan.diasSemana.includes(dow);
    const k=`${hoy()}__${usuario.plan}__${usuario.id}`;
    if(asistencia[k]){ setMsgColor(C.yellow); setMsg("⚠️ Ya marcaste tu asistencia hoy."); return; }
    const horaActual=new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
    setAsistencia(prev=>({...prev,[k]:{hora:horaActual,turnoDetectado,plan:usuario.plan}}));
    setMsgColor(C.green); setMsg(`✅ ¡Asistencia registrada! ${horaActual}hs — Buen entrenamiento 💪`);
  };

  if(usuario.rol==="alumno"){
    const yaPresente=!!asistencia[`${hoy()}__${usuario.plan}__${usuario.id}`];
    const reg=asistencia[`${hoy()}__${usuario.plan}__${usuario.id}`];
    const plan=planInfo(usuario.plan);
    return (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16,padding:"16px 0"}}>
        <Card style={{width:"100%",textAlign:"center",padding:16,borderColor:C.accent+"44"}}>
          <div style={{color:C.textSecondary,fontSize:12}}>{plan.label} — {plan.horaLabel}</div>
          <div style={{color:C.textMuted,fontSize:11}}>{plan.lugar===LUGAR.MER?"Mercado del Patio":"Parque Independencia"}</div>
        </Card>
        {yaPresente?(
          <Card style={{textAlign:"center",padding:32,borderColor:C.green+"66",width:"100%"}}>
            <div style={{fontSize:48,marginBottom:8}}>✅</div>
            <div style={{color:C.green,fontWeight:800,fontSize:18}}>¡Presente registrado!</div>
            <div style={{color:C.textSecondary,fontSize:13,marginTop:4}}>{reg?.hora}hs — {fmtFecha(hoy())}</div>
          </Card>
        ):(
          <Card style={{textAlign:"center",padding:28,width:"100%"}}>
            <div style={{color:C.textSecondary,fontSize:13,marginBottom:20}}>Tocá para registrar tu asistencia de hoy</div>
            <Btn size="lg" onClick={marcarPresente} style={{justifyContent:"center",fontSize:16,padding:"14px 36px"}}>
              <Ic p={I.check} s={20}/> Marcar presente
            </Btn>
            {msg&&<div style={{color:msgColor,fontSize:13,marginTop:12,fontWeight:600}}>{msg}</div>}
          </Card>
        )}
      </div>
    );
  }

  // Admin: QR único + resumen presentes
  const presHoy=Object.keys(asistencia).filter(k=>k.startsWith(hoy()+"__")).length;
  const resumenTurnos=PLANES.map(p=>{
    const al=alumnos.filter(a=>a.plan===p.id&&a.activo&&a.aprobado);
    const pr=al.filter(a=>asistencia[`${hoy()}__${p.id}__${a.id}`]).length;
    return {...p,total:al.length,presentes:pr};
  }).filter(p=>p.total>0);

  return (
    <div>
      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        <Card style={{flex:"0 0 auto",display:"flex",flexDirection:"column",alignItems:"center",gap:14,padding:24}}>
          <div style={{color:C.accent,fontWeight:800,fontSize:14,textAlign:"center"}}>QR ÚNICO — {fmtFecha(hoy())}</div>
          <QRCanvas value={QR_VALUE} size={200}/>
          <div style={{color:C.textMuted,fontSize:11,textAlign:"center",maxWidth:200}}>
            Mostrá este QR en cada clase.<br/>Los alumnos tocan "Marcar presente" en su app.
          </div>
          <div style={{background:C.accent+"11",border:`1px solid ${C.accent}33`,borderRadius:8,padding:"8px 14px",textAlign:"center"}}>
            <div style={{color:C.accent,fontWeight:800,fontSize:24}}>{presHoy}</div>
            <div style={{color:C.textSecondary,fontSize:11}}>presentes hoy en total</div>
          </div>
        </Card>
        <Card style={{flex:1,minWidth:200,padding:20}}>
          <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:1}}>Por turno — hoy</div>
          {resumenTurnos.map(p=>(
            <div key={p.id} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                <span style={{color:C.textSecondary,fontSize:12}}>{p.label}</span>
                <span style={{color:C.textPrimary,fontWeight:700,fontSize:13}}>{p.presentes}/{p.total}</span>
              </div>
              <div style={{background:C.border,borderRadius:3,height:5}}>
                <div style={{width:p.total?`${Math.round(p.presentes/p.total*100)}%`:"0%",height:"100%",background:C.accent,borderRadius:3}}/>
              </div>
            </div>
          ))}
          {resumenTurnos.length===0&&<div style={{color:C.textMuted,fontSize:13}}>Sin alumnos activos aún</div>}
        </Card>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DASHBOARD ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const calcStats = (alumnos, asistencia, pagos, mes) => {
  const ind = alumnos.filter(a=>planInfo(a.plan).lugar===LUGAR.IND);
  const mer = alumnos.filter(a=>planInfo(a.plan).lugar===LUGAR.MER);

  const actInd=ind.filter(a=>a.activo&&a.aprobado).length;
  const actMer=mer.filter(a=>a.activo&&a.aprobado).length;
  const actTotal=actInd+actMer;

  const inactInd=ind.filter(a=>!a.activo&&a.aprobado).length;
  const inactMer=mer.filter(a=>!a.activo&&a.aprobado).length;
  const inactTotal=inactInd+inactMer;

  const pagInd=ind.filter(a=>a.activo&&a.aprobado&&pagos[`${a.id}__${mes}`]).length;
  const pagMer=mer.filter(a=>a.activo&&a.aprobado&&pagos[`${a.id}__${mes}`]).length;

  const noPagInd=actInd-pagInd;
  const noPagMer=actMer-pagMer;
  const noPagTotal=noPagInd+noPagMer;

  const facInd=ind.filter(a=>a.activo&&a.aprobado&&pagos[`${a.id}__${mes}`]).reduce((s,a)=>s+(pagos[`${a.id}__${mes}`]?.monto||planInfo(a.plan).cuota),0);
  const facMer=mer.filter(a=>a.activo&&a.aprobado&&pagos[`${a.id}__${mes}`]).reduce((s,a)=>s+(pagos[`${a.id}__${mes}`]?.monto||planInfo(a.plan).cuota),0);

  // Asistencia %
  const pctAsistAlumno = (a,m) => {
    const posibles=diasPosiblesHastaHoy(a.plan,m);
    if(!posibles) return 0;
    const pres=Object.keys(asistencia).filter(k=>{const[f,p,id]=k.split("__");return f.slice(0,7)===m&&p===a.plan&&id==a.id;}).length;
    return Math.min(100,Math.round(pres/posibles*100));
  };

  const avgAsistInd=ind.filter(a=>a.activo&&a.aprobado).map(a=>pctAsistAlumno(a,mes));
  const avgAsistMer=mer.filter(a=>a.activo&&a.aprobado).map(a=>pctAsistAlumno(a,mes));
  const avg=arr=>arr.length?Math.round(arr.reduce((s,v)=>s+v,0)/arr.length):0;

  // Ventas (alumnos nuevos este mes)
  const vtas=(mes2,list)=>list.filter(a=>a.aprobado&&a.fechaIngreso?.slice(0,7)===mes2).length;

  return {
    actInd,actMer,actTotal,inactInd,inactMer,inactTotal,
    pagInd,pagMer,noPagInd,noPagMer,noPagTotal,
    facInd,facMer,facTotal:facInd+facMer,
    vtaInd:vtas(mes,ind),vtaMer:vtas(mes,mer),vtaTotal:vtas(mes,alumnos),
    asistInd:avg(avgAsistInd),asistMer:avg(avgAsistMer),asistTotal:avg([...avgAsistInd,...avgAsistMer]),
    pctInactInd:actInd+inactInd?Math.round(inactInd/(actInd+inactInd)*100):0,
    pctInactMer:actMer+inactMer?Math.round(inactMer/(actMer+inactMer)*100):0,
    pctInactTotal:actTotal+inactTotal?Math.round(inactTotal/(actTotal+inactTotal)*100):0,
    pctNoPagInd:actInd?Math.round(noPagInd/actInd*100):0,
    pctNoPagMer:actMer?Math.round(noPagMer/actMer*100):0,
    pctNoPagTotal:actTotal?Math.round(noPagTotal/actTotal*100):0,
  };
};

const TriCol = ({label,ind,mer,total,fmt=v=>v,colorFn}) => {
  const col=colorFn||((v,_t)=>C.textPrimary);
  return (
    <Card style={{padding:14}}>
      <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
        {[["Independencia",ind,C.orange],["Mercado",mer,C.purple],["Total",total,C.accent]].map(([n,v,c])=>(
          <div key={n} style={{background:C.bg,borderRadius:8,padding:"10px 6px"}}>
            <div style={{color:colorFn?colorFn(v,total):c,fontWeight:800,fontSize:20}}>{fmt(v)}</div>
            <div style={{color:C.textMuted,fontSize:10,marginTop:2}}>{n}</div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const AdminDashboard = ({alumnos,asistencia,pagos,pendientes}) => {
  const mes=mesActual();
  const s=calcStats(alumnos,asistencia,pagos,mes);
  const pctColor=v=>v>=80?C.green:v>=50?C.yellow:C.red;
  const fmt$=v=>`$${(v/1000).toFixed(0)}k`;

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      {pendientes?.length>0&&(
        <Card style={{borderColor:C.yellow+"66",padding:12,background:C.yellow+"08"}}>
          <div style={{color:C.yellow,fontSize:13,fontWeight:700}}>⚠️ {pendientes.length} solicitud{pendientes.length>1?"es":""} de registro pendiente{pendientes.length>1?"s":""}</div>
        </Card>
      )}

      {/* Alumnos activos */}
      <TriCol label="Alumnos activos" ind={s.actInd} mer={s.actMer} total={s.actTotal}/>

      {/* Facturación */}
      <TriCol label={`Facturación — ${fmtMes(mes)}`} ind={s.facInd} mer={s.facMer} total={s.facTotal} fmt={fmt$} colorFn={()=>C.green}/>

      {/* Ventas nuevas */}
      <TriCol label="Altas este mes" ind={s.vtaInd} mer={s.vtaMer} total={s.vtaTotal} colorFn={()=>C.blue}/>

      {/* Inactivos */}
      <Card style={{padding:14}}>
        <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Inactivos</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          {[["Independencia",s.inactInd,s.pctInactInd],["Mercado",s.inactMer,s.pctInactMer],["Total",s.inactTotal,s.pctInactTotal]].map(([n,v,pct])=>(
            <div key={n} style={{background:C.bg,borderRadius:8,padding:"10px 6px"}}>
              <div style={{color:C.red,fontWeight:800,fontSize:20}}>{v}</div>
              <div style={{color:C.textMuted,fontSize:10}}>{n}</div>
              <Badge color={C.red} style={{marginTop:4}}>{pct}%</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* No pagaron */}
      <Card style={{padding:14}}>
        <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Sin pagar este mes</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          {[["Independencia",s.noPagInd,s.pctNoPagInd],["Mercado",s.noPagMer,s.pctNoPagMer],["Total",s.noPagTotal,s.pctNoPagTotal]].map(([n,v,pct])=>(
            <div key={n} style={{background:C.bg,borderRadius:8,padding:"10px 6px"}}>
              <div style={{color:C.yellow,fontWeight:800,fontSize:20}}>{v}</div>
              <div style={{color:C.textMuted,fontSize:10}}>{n}</div>
              <Badge color={C.yellow} style={{marginTop:4}}>{pct}%</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Inactivos + No pago combinado */}
      <Card style={{padding:14}}>
        <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Inactivos + Sin pagar (riesgo)</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}>
          {[
            ["Independencia",s.inactInd+s.noPagInd,(s.actInd+s.inactInd)?Math.round((s.inactInd+s.noPagInd)/(s.actInd+s.inactInd)*100):0],
            ["Mercado",s.inactMer+s.noPagMer,(s.actMer+s.inactMer)?Math.round((s.inactMer+s.noPagMer)/(s.actMer+s.inactMer)*100):0],
            ["Total",s.inactTotal+s.noPagTotal,(s.actTotal+s.inactTotal)?Math.round((s.inactTotal+s.noPagTotal)/(s.actTotal+s.inactTotal)*100):0],
          ].map(([n,v,pct])=>(
            <div key={n} style={{background:C.bg,borderRadius:8,padding:"10px 6px"}}>
              <div style={{color:C.red,fontWeight:800,fontSize:20}}>{v}</div>
              <div style={{color:C.textMuted,fontSize:10}}>{n}</div>
              <Badge color={pct>30?C.red:pct>15?C.yellow:C.green} style={{marginTop:4}}>{pct}%</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Asistencia % */}
      <Card style={{padding:16}}>
        <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:14,textTransform:"uppercase",letterSpacing:.5}}>% Asistencia promedio — {fmtMes(mes)}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,textAlign:"center"}}>
          {[["Independencia",s.asistInd],["Mercado",s.asistMer],["Total",s.asistTotal]].map(([n,v])=>(
            <div key={n} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <Ring pct={v} size={72} color={pctColor(v)}/>
              <div style={{color:C.textSecondary,fontSize:11}}>{n}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Cumpleaños del mes */}
      <CumpleaniosMes alumnos={alumnos}/>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CUMPLEAÑOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const CumpleaniosMes = ({alumnos}) => {
  const mesHoy=today.getMonth()+1;
  const diaHoy=today.getDate();
  const cumples=alumnos.filter(a=>a.aprobado&&a.cumpleanos).map(a=>{
    const[,m,d]=a.cumpleanos.split("-").map(Number);
    return {...a,mesCumple:m,diaCumple:d};
  }).filter(a=>a.mesCumple===mesHoy).sort((a,b)=>a.diaCumple-b.diaCumple);

  if(cumples.length===0) return null;
  return (
    <Card style={{borderColor:C.yellow+"55",background:C.yellow+"08",padding:14}}>
      <div style={{color:C.yellow,fontSize:12,fontWeight:700,marginBottom:10}}>🎂 Cumpleaños este mes</div>
      {cumples.map(a=>(
        <div key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
          <span style={{fontSize:18}}>{a.diaCumple===diaHoy?"🎉":"🎂"}</span>
          <Av nombre={a.nombre} size={28}/>
          <div style={{flex:1}}>
            <div style={{color:a.diaCumple===diaHoy?C.yellow:C.textPrimary,fontWeight:a.diaCumple===diaHoy?800:600,fontSize:13}}>
              {a.nombre} {a.diaCumple===diaHoy&&"— ¡HOY!"}
            </div>
          </div>
          <Badge color={C.yellow}>{a.diaCumple}/{mesHoy}</Badge>
        </div>
      ))}
    </Card>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ALUMNOS ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AdminAlumnos = ({alumnos,setAlumnos,pendientes,setPendientes,asistencia,pagos,setVista,setAlumnoDetalle}) => {
  const [tab,setTab]=useState("activos");
  const [modal,setModal]=useState(null);
  const [histModal,setHistModal]=useState(null);
  const [histForm,setHistForm]=useState({mes:"",presentes:"",total:""});
  const [form,setForm]=useState({nombre:"",email:"",pass:"1234",plan:"man3",telefono:"",activo:true,antiguedadMeses:0,objetivo:"",cumpleanos:""});
  const [search,setSearch]=useState("");
  const [filtLugar,setFiltLugar]=useState("todos");

  const abrir=a=>{ setForm(a?{...a}:{nombre:"",email:"",pass:"1234",plan:"man3",telefono:"",activo:true,antiguedadMeses:0,objetivo:"",cumpleanos:""}); setModal(a||"add"); };
  const guardar=()=>{
    if(!form.nombre.trim()) return;
    if(modal==="add") setAlumnos(prev=>[...prev,{...form,id:Date.now(),aprobado:true,fechaIngreso:hoy(),historialAsistencia:{}}]);
    else setAlumnos(prev=>prev.map(a=>a.id===modal.id?{...a,...form}:a));
    setModal(null);
  };
  const aprobar=p=>{ setAlumnos(prev=>[...prev,{...p,aprobado:true}]); setPendientes(prev=>prev.filter(x=>x.id!==p.id)); };
  const rechazar=id=>setPendientes(prev=>prev.filter(x=>x.id!==id));
  const guardarHist=()=>{
    if(!histForm.mes||!histForm.presentes||!histForm.total) return;
    const pct=Math.round(parseInt(histForm.presentes)/parseInt(histForm.total)*100);
    setAlumnos(prev=>prev.map(a=>a.id===histModal?{...a,historialAsistencia:{...(a.historialAsistencia||{}),[histForm.mes]:{presentes:parseInt(histForm.presentes),total:parseInt(histForm.total),pct}}}:a));
    setHistForm({mes:"",presentes:"",total:""});
  };

  const aprobados=alumnos.filter(a=>a.aprobado);
  const filtrar=list=>list
    .filter(a=>filtLugar==="todos"||(filtLugar==="ind"?planInfo(a.plan).lugar===LUGAR.IND:planInfo(a.plan).lugar===LUGAR.MER))
    .filter(a=>a.nombre?.toLowerCase().includes(search.toLowerCase()));

  const listas={activos:filtrar(aprobados.filter(a=>a.activo)),inactivos:filtrar(aprobados.filter(a=>!a.activo)),pendientes:pendientes};
  const lista=listas[tab]||[];

  return (
    <div>
      {pendientes.length>0&&<Card style={{marginBottom:10,borderColor:C.yellow+"66",padding:10}}><div style={{color:C.yellow,fontSize:13,fontWeight:700}}>⚠️ {pendientes.length} solicitud{pendientes.length>1?"es":""} pendiente{pendientes.length>1?"s":""}</div></Card>}

      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap",alignItems:"center"}}>
        <div style={{display:"flex",background:C.bg,borderRadius:8,padding:3}}>
          {[["activos","Activos"],["inactivos","Inactivos"],["pendientes","Solicitudes"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{border:"none",borderRadius:6,padding:"6px 12px",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:700,background:tab===k?C.accent:"transparent",color:tab===k?C.accentText:C.textSecondary}}>
              {l}{k==="pendientes"&&pendientes.length>0&&` (${pendientes.length})`}
            </button>
          ))}
        </div>
        {tab!=="pendientes"&&<>
          <Sel value={filtLugar} onChange={setFiltLugar} style={{maxWidth:160}}>
            <option value="todos">Todos</option>
            <option value="ind">Independencia</option>
            <option value="mer">Mercado</option>
          </Sel>
          <Inp value={search} onChange={setSearch} placeholder="Buscar..." style={{maxWidth:200}}/>
          <Btn onClick={()=>abrir()}><Ic p={I.plus} s={14}/> Nuevo</Btn>
        </>}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {tab==="pendientes"?pendientes.map(p=>(
          <Card key={p.id} style={{padding:"12px 14px"}}>
            <div style={{display:"flex",alignItems:"flex-start",gap:10,flexWrap:"wrap"}}>
              <Av nombre={p.nombre}/>
              <div style={{flex:1}}>
                <div style={{color:C.textPrimary,fontWeight:600,fontSize:14}}>{p.nombre}</div>
                <div style={{color:C.textSecondary,fontSize:12}}>{p.email} · {p.telefono}</div>
                <PlanBadge planId={p.plan}/>
                {p.objetivo&&<div style={{color:C.textMuted,fontSize:11,marginTop:4}}>🎯 {p.objetivo}</div>}
                {p.cumpleanos&&<div style={{color:C.textMuted,fontSize:11}}>🎂 {fmtFecha(p.cumpleanos)}</div>}
              </div>
              <div style={{display:"flex",gap:6}}>
                <Btn variant="success" size="sm" onClick={()=>aprobar(p)}>✓ Aprobar</Btn>
                <Btn variant="danger" size="sm" onClick={()=>rechazar(p.id)}>Rechazar</Btn>
              </div>
            </div>
          </Card>
        )):lista.map(a=>{
          const mes=mesActual();
          const pagado=!!pagos[`${a.id}__${mes}`];
          return (
            <Card key={a.id} style={{padding:"11px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                <Av nombre={a.nombre}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{color:C.textPrimary,fontWeight:600,fontSize:14,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.nombre}</div>
                  <div style={{color:C.textSecondary,fontSize:11}}>{a.email}</div>
                  <div style={{display:"flex",gap:4,marginTop:3,flexWrap:"wrap"}}>
                    <PlanBadge planId={a.plan}/>
                    <LugarBadge planId={a.plan}/>
                    <Badge color={C.purple}>{a.antiguedadMeses||0}m</Badge>
                    <Badge color={pagado?C.green:C.red}>{pagado?"Al día":"Sin pagar"}</Badge>
                  </div>
                </div>
                <div style={{display:"flex",gap:4}}>
                  <Btn variant="lime" size="sm" title="Ver perfil completo" onClick={()=>{ setAlumnoDetalle(a.id); setVista("alumnoDetalle"); }}><Ic p={I.eye} s={13}/></Btn>
                  <Btn variant="lime" size="sm" title="Historial" onClick={()=>setHistModal(a.id)}><Ic p={I.cal} s={13}/></Btn>
                  <Btn variant="ghost" size="sm" onClick={()=>abrir(a)}><Ic p={I.edit} s={13}/></Btn>
                  <Btn variant="danger" size="sm" onClick={()=>setAlumnos(prev=>prev.filter(x=>x.id!==a.id))}><Ic p={I.trash} s={13}/></Btn>
                </div>
              </div>
            </Card>
          );
        })}
        {lista.length===0&&tab!=="pendientes"&&<div style={{color:C.textMuted,textAlign:"center",padding:40}}>Sin alumnos</div>}
      </div>

      {modal&&(
        <Modal title={modal==="add"?"Nuevo alumno":"Editar alumno"} onClose={()=>setModal(null)}>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            {[["nombre","Nombre"],["email","Email"],["telefono","Teléfono"]].map(([k,l])=>(
              <div key={k}><div style={{color:C.textSecondary,fontSize:11,marginBottom:3}}>{l}</div><Inp value={form[k]||""} onChange={v=>setForm(f=>({...f,[k]:v}))} placeholder={l}/></div>
            ))}
            <div><div style={{color:C.textSecondary,fontSize:11,marginBottom:3}}>Contraseña</div><Inp type="password" value={form.pass||""} onChange={v=>setForm(f=>({...f,pass:v}))} placeholder="Contraseña"/></div>
            <div><div style={{color:C.textSecondary,fontSize:11,marginBottom:3}}>Plan</div>
              <Sel value={form.plan} onChange={v=>setForm(f=>({...f,plan:v}))}>
                {PLANES.map(p=><option key={p.id} value={p.id}>{p.label} — {p.horaLabel}</option>)}
              </Sel>
            </div>
            <div><div style={{color:C.textSecondary,fontSize:11,marginBottom:3}}>Cumpleaños</div><Inp type="date" value={form.cumpleanos||""} onChange={v=>setForm(f=>({...f,cumpleanos:v}))}/></div>
            <div><div style={{color:C.textSecondary,fontSize:11,marginBottom:3}}>Antigüedad (meses)</div><Inp type="number" value={form.antiguedadMeses||0} onChange={v=>setForm(f=>({...f,antiguedadMeses:parseInt(v)||0}))}/></div>
            <div><div style={{color:C.textSecondary,fontSize:11,marginBottom:3}}>Objetivo</div>
              <textarea value={form.objetivo||""} onChange={e=>setForm(f=>({...f,objetivo:e.target.value}))} placeholder="Objetivo del alumno..."
                style={{width:"100%",minHeight:60,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPrimary,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <input type="checkbox" id="actchk" checked={!!form.activo} onChange={e=>setForm(f=>({...f,activo:e.target.checked}))} style={{accentColor:C.accent,width:15,height:15}}/>
              <label htmlFor="actchk" style={{color:C.textSecondary,fontSize:13,cursor:"pointer"}}>Activo</label>
            </div>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn variant="ghost" onClick={()=>setModal(null)}>Cancelar</Btn>
              <Btn onClick={guardar}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      {histModal&&(()=>{
        const a=alumnos.find(x=>x.id===histModal);
        return (
          <Modal title={`Historial — ${a?.nombre}`} onClose={()=>setHistModal(null)}>
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                <div><div style={{color:C.textMuted,fontSize:11,marginBottom:3}}>Mes (YYYY-MM)</div><Inp value={histForm.mes} onChange={v=>setHistForm(f=>({...f,mes:v}))} placeholder="2024-03"/></div>
                <div><div style={{color:C.textMuted,fontSize:11,marginBottom:3}}>Presentes</div><Inp type="number" value={histForm.presentes} onChange={v=>setHistForm(f=>({...f,presentes:v}))} placeholder="10"/></div>
                <div><div style={{color:C.textMuted,fontSize:11,marginBottom:3}}>Posibles</div><Inp type="number" value={histForm.total} onChange={v=>setHistForm(f=>({...f,total:v}))} placeholder="12"/></div>
              </div>
              <Btn onClick={guardarHist}><Ic p={I.plus} s={13}/> Agregar mes</Btn>
              {Object.entries(a?.historialAsistencia||{}).sort((a,b)=>b[0].localeCompare(a[0])).map(([m,d])=>(
                <div key={m} style={{display:"flex",gap:8,alignItems:"center",padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{color:C.textSecondary,fontSize:13,minWidth:70}}>{fmtMes(m)}</span>
                  <Badge color={d.pct>=80?C.green:d.pct>=50?C.yellow:C.red}>{d.pct}%</Badge>
                  <span style={{color:C.textMuted,fontSize:12}}>{d.presentes}/{d.total}</span>
                  <Btn variant="danger" size="sm" style={{marginLeft:"auto",padding:"2px 5px"}}
                    onClick={()=>setAlumnos(prev=>prev.map(al=>al.id===histModal?{...al,historialAsistencia:Object.fromEntries(Object.entries(al.historialAsistencia||{}).filter(([k])=>k!==m))}:al))}>
                    <Ic p={I.x} s={11}/>
                  </Btn>
                </div>
              ))}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DETALLE ALUMNO (admin ve perfil completo)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AlumnoDetalle = ({alumnoId,alumnos,asistencia,pagos,onBack}) => {
  const a=alumnos.find(x=>x.id===alumnoId);
  if(!a) return <div style={{color:C.textMuted,padding:40,textAlign:"center"}}>Alumno no encontrado</div>;

  const mes=mesActual();
  const plan=planInfo(a.plan);
  const pagado=!!pagos[`${a.id}__${mes}`];
  const premio=premioActual(a.antiguedadMeses||0);
  const proximo=proximoPremio(a.antiguedadMeses||0);

  // Presentes este mes
  const presentesMes=Object.keys(asistencia).filter(k=>{const[f,p,id]=k.split("__");return f.slice(0,7)===mes&&p===a.plan&&id==a.id;}).length;
  const posiblesMes=diasPosiblesHastaHoy(a.plan,mes);
  const pctMes=posiblesMes?Math.min(100,Math.round(presentesMes/posiblesMes*100)):0;
  const pctColor=v=>v>=80?C.green:v>=50?C.yellow:C.red;

  // Todos los registros de asistencia
  const todosLosRegistros=Object.entries(asistencia)
    .filter(([k])=>{ const[,p,id]=k.split("__"); return p===a.plan&&id==a.id; })
    .map(([k,v])=>{ const[fecha]=k.split("__"); return {fecha,hora:v?.hora||""}; })
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));

  // Historial por mes (combinando registros automáticos + cargados)
  const mesesHist={};
  todosLosRegistros.forEach(r=>{
    const m=r.fecha.slice(0,7);
    if(!mesesHist[m]) mesesHist[m]={presentes:0,total:diasPosiblesEnMes(a.plan,m),pct:0,registros:[]};
    mesesHist[m].presentes++;
    mesesHist[m].registros.push(r);
  });
  Object.keys(mesesHist).forEach(m=>{
    mesesHist[m].pct=mesesHist[m].total?Math.min(100,Math.round(mesesHist[m].presentes/mesesHist[m].total*100)):0;
  });
  // Merge con historial cargado manualmente
  const histCompleto={...mesesHist,...(a.historialAsistencia||{})};
  const mesesOrden=Object.keys(histCompleto).sort((a,b)=>b.localeCompare(a));

  return (
    <div>
      <Btn variant="ghost" size="sm" onClick={onBack} style={{marginBottom:14}}>← Volver</Btn>

      {/* Header */}
      <Card style={{marginBottom:14,padding:20}}>
        <div style={{display:"flex",gap:14,alignItems:"center",flexWrap:"wrap"}}>
          <Av nombre={a.nombre} size={60}/>
          <div style={{flex:1}}>
            <div style={{color:C.textPrimary,fontWeight:800,fontSize:20}}>{a.nombre}</div>
            <div style={{color:C.textSecondary,fontSize:13}}>{a.email} · {a.telefono}</div>
            {a.cumpleanos&&<div style={{color:C.yellow,fontSize:12}}>🎂 {fmtFecha(a.cumpleanos)}</div>}
            <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
              <PlanBadge planId={a.plan}/>
              <LugarBadge planId={a.plan}/>
              <Badge color={C.purple}>{a.antiguedadMeses||0} meses</Badge>
              <Badge color={pagado?C.green:C.red}>{pagado?"Al día":"Sin pagar"}</Badge>
              <Badge color={a.activo?C.green:C.textMuted}>{a.activo?"Activo":"Inactivo"}</Badge>
            </div>
          </div>
        </div>
        {a.objetivo&&(
          <div style={{marginTop:12,padding:"10px 14px",background:C.accent+"0A",borderRadius:8,borderLeft:`3px solid ${C.accent}`}}>
            <div style={{color:C.accent,fontSize:11,fontWeight:700,marginBottom:2}}>🎯 OBJETIVO</div>
            <div style={{color:C.textSecondary,fontSize:13}}>{a.objetivo}</div>
          </div>
        )}
      </Card>

      {/* Premio */}
      {(premio||proximo)&&(
        <Card style={{marginBottom:14,padding:14}}>
          <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>🏆 Premios por constancia</div>
          {premio&&(
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8,padding:"8px 12px",background:premio.color+"11",borderRadius:8,border:`1px solid ${premio.color}33`}}>
              <span style={{fontSize:24}}>{premio.emoji}</span>
              <div>
                <div style={{color:premio.color,fontWeight:800,fontSize:13}}>Premio actual: {premio.label}</div>
                <div style={{color:C.textMuted,fontSize:11}}>{premio.meses} meses de constancia</div>
              </div>
            </div>
          )}
          {proximo&&(
            <div style={{color:C.textMuted,fontSize:12}}>
              Próximo premio en <strong style={{color:C.accent}}>{proximo.meses-(a.antiguedadMeses||0)} meses</strong>: {proximo.emoji} {proximo.label}
            </div>
          )}
        </Card>
      )}

      {/* Asistencia mes actual */}
      <Card style={{marginBottom:14,padding:16}}>
        <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Asistencia — {fmtMes(mes)}</div>
        <div style={{display:"flex",gap:16,alignItems:"center"}}>
          <Ring pct={pctMes} size={80} color={pctColor(pctMes)}/>
          <div>
            <div style={{color:C.textPrimary,fontSize:26,fontWeight:800}}>{presentesMes}<span style={{color:C.textMuted,fontSize:16}}>/{posiblesMes} días</span></div>
            <div style={{color:C.textSecondary,fontSize:12}}>Días posibles hasta hoy</div>
            <div style={{color:C.textMuted,fontSize:11,marginTop:2}}>{plan.horaLabel} — {plan.lugar===LUGAR.MER?"Mercado del Patio":"Parque Independencia"}</div>
          </div>
        </div>
      </Card>

      {/* Historial completo */}
      <Card style={{marginBottom:14}}>
        <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Historial completo de asistencia</div>
        {mesesOrden.length===0?<div style={{color:C.textMuted,fontSize:13}}>Sin registros aún</div>
          :mesesOrden.map(m=>{
            const d=histCompleto[m];
            const regs=d.registros||[];
            return (
              <div key={m} style={{marginBottom:10,paddingBottom:10,borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{color:C.textSecondary,fontSize:13,fontWeight:600,minWidth:80}}>{fmtMes(m)}</span>
                  <div style={{flex:1,background:C.border,borderRadius:3,height:6}}>
                    <div style={{width:`${d.pct}%`,height:"100%",borderRadius:3,background:pctColor(d.pct)}}/>
                  </div>
                  <Badge color={pctColor(d.pct)}>{d.pct}%</Badge>
                  <span style={{color:C.textMuted,fontSize:11}}>{d.presentes}/{d.total}</span>
                </div>
                {regs.length>0&&(
                  <div style={{paddingLeft:12,display:"flex",flexWrap:"wrap",gap:4}}>
                    {regs.map((r,i)=><Badge key={i} color={C.textMuted} style={{fontSize:10}}>{fmtFecha(r.fecha)}{r.hora?` ${r.hora}`:""}</Badge>)}
                  </div>
                )}
              </div>
            );
          })}
      </Card>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ASISTENCIA ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AdminAsistencia = ({alumnos,asistencia,setAsistencia}) => {
  const [fecha,setFecha]=useState(hoy());
  const [filtroPlan,setFiltroPlan]=useState("todos");

  const toggle=(id,plan)=>{
    const k=`${fecha}__${plan}__${id}`;
    setAsistencia(prev=>{const next={...prev}; if(next[k]) delete next[k]; else next[k]={hora:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}; return next;});
  };

  const mes=fecha.slice(0,7);
  const pctAlumno=a=>{
    const pos=diasPosiblesHastaHoy(a.plan,mes); if(!pos) return 0;
    const pr=Object.keys(asistencia).filter(k=>{const[f,p,id]=k.split("__");return f.slice(0,7)===mes&&p===a.plan&&id==a.id;}).length;
    return Math.min(100,Math.round(pr/pos*100));
  };

  const planesActivos=PLANES.map(p=>({...p,alumnos:alumnos.filter(a=>a.plan===p.id&&a.activo&&a.aprobado)})).filter(p=>p.alumnos.length>0);
  const mostrar=filtroPlan==="todos"?planesActivos:planesActivos.filter(p=>p.id===filtroPlan);

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <Inp type="date" value={fecha} onChange={setFecha} style={{maxWidth:180}}/>
        <Sel value={filtroPlan} onChange={setFiltroPlan} style={{maxWidth:200}}>
          <option value="todos">Todos los planes</option>
          {PLANES.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
        </Sel>
      </div>

      {mostrar.map(p=>{
        const presentes=p.alumnos.filter(a=>asistencia[`${fecha}__${p.id}__${a.id}`]).length;
        const pct=p.alumnos.length?Math.round(presentes/p.alumnos.length*100):0;
        return (
          <div key={p.id} style={{marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <div style={{fontWeight:700,fontSize:14,color:C.textPrimary}}>{p.label}</div>
              <div style={{color:C.textMuted,fontSize:12}}>{p.horaLabel}</div>
              <Badge color={p.lugar===LUGAR.MER?C.purple:C.orange}>{p.lugar===LUGAR.MER?"Mercado":"Independencia"}</Badge>
              <div style={{flex:1,background:C.border,borderRadius:3,height:5}}>
                <div style={{width:`${pct}%`,height:"100%",background:pct>70?C.green:pct>40?C.yellow:C.red,borderRadius:3}}/>
              </div>
              <span style={{color:C.textSecondary,fontSize:13,fontWeight:700}}>{presentes}/{p.alumnos.length}</span>
              <Btn variant="ghost" size="sm" onClick={()=>setAsistencia(prev=>{const next={...prev};p.alumnos.forEach(a=>{next[`${fecha}__${p.id}__${a.id}`]={hora:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})};});return next;})}>
                Todos ✓
              </Btn>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {p.alumnos.map(a=>{
                const pr=!!asistencia[`${fecha}__${p.id}__${a.id}`];
                const reg=asistencia[`${fecha}__${p.id}__${a.id}`];
                const pctM=pctAlumno(a);
                return (
                  <Card key={a.id} onClick={()=>toggle(a.id,p.id)}
                    style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                      borderColor:pr?C.accent+"66":C.border,cursor:"pointer"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",flexShrink:0,background:pr?C.accent:C.border,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {pr&&<Ic p={I.check} s={14} c={C.accentText}/>}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{color:pr?C.textPrimary:C.textSecondary,fontWeight:pr?600:400,fontSize:13}}>{a.nombre}</div>
                      {pr&&reg?.hora&&<div style={{color:C.textMuted,fontSize:11}}>{reg.hora}hs</div>}
                    </div>
                    <Ring pct={pctM} size={36} color={pctM>=80?C.green:pctM>=50?C.yellow:C.red}/>
                    <Badge color={pr?C.green:C.textMuted}>{pr?"Presente":"Ausente"}</Badge>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGOS ADMIN
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const AdminPagos = ({alumnos,pagos,setPagos}) => {
  const [mes,setMes]=useState(mesActual());
  const [filtLugar,setFiltLugar]=useState("todos");

  const meses=Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-i);return d.toISOString().slice(0,7);});
  const toggle=(id,plan)=>{
    const k=`${id}__${mes}`;
    setPagos(prev=>{const next={...prev};if(next[k]) delete next[k];else next[k]={fecha:hoy(),monto:planInfo(plan).cuota};return next;});
  };

  const activos=alumnos.filter(a=>a.activo&&a.aprobado);
  const filtrado=activos.filter(a=>filtLugar==="todos"||(filtLugar==="ind"?planInfo(a.plan).lugar===LUGAR.IND:planInfo(a.plan).lugar===LUGAR.MER));

  const facInd=filtrado.filter(a=>planInfo(a.plan).lugar===LUGAR.IND&&pagos[`${a.id}__${mes}`]).reduce((s,a)=>s+(pagos[`${a.id}__${mes}`]?.monto||planInfo(a.plan).cuota),0);
  const facMer=filtrado.filter(a=>planInfo(a.plan).lugar===LUGAR.MER&&pagos[`${a.id}__${mes}`]).reduce((s,a)=>s+(pagos[`${a.id}__${mes}`]?.monto||planInfo(a.plan).cuota),0);

  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
        <Sel value={mes} onChange={setMes} style={{maxWidth:180}}>{meses.map(m=><option key={m} value={m}>{fmtMes(m)}</option>)}</Sel>
        <Sel value={filtLugar} onChange={setFiltLugar} style={{maxWidth:160}}>
          <option value="todos">Todos</option><option value="ind">Independencia</option><option value="mer">Mercado</option>
        </Sel>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        <Card style={{textAlign:"center",padding:12}}><div style={{color:C.green,fontWeight:800,fontSize:24}}>{filtrado.filter(a=>pagos[`${a.id}__${mes}`]).length}</div><div style={{color:C.textMuted,fontSize:11}}>Pagaron</div></Card>
        <Card style={{textAlign:"center",padding:12}}><div style={{color:C.red,fontWeight:800,fontSize:24}}>{filtrado.filter(a=>!pagos[`${a.id}__${mes}`]).length}</div><div style={{color:C.textMuted,fontSize:11}}>Pendientes</div></Card>
        <Card style={{textAlign:"center",padding:12}}>
          <div style={{color:C.orange,fontSize:10,fontWeight:700}}>IND ${(facInd/1000).toFixed(0)}k · MER ${(facMer/1000).toFixed(0)}k</div>
          <div style={{color:C.accent,fontWeight:800,fontSize:20}}>${((facInd+facMer)/1000).toFixed(0)}k</div>
          <div style={{color:C.textMuted,fontSize:11}}>Facturado</div>
        </Card>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {filtrado.map(a=>{
          const p=!!pagos[`${a.id}__${mes}`]; const info=pagos[`${a.id}__${mes}`];
          return (
            <Card key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px"}}>
              <Av nombre={a.nombre}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:C.textPrimary,fontWeight:600,fontSize:13}}>{a.nombre}</div>
                <div style={{color:C.textSecondary,fontSize:11}}>{p?`${fmtFecha(info.fecha)} — $${info.monto?.toLocaleString("es-AR")}`:`Cuota: $${planInfo(a.plan).cuota.toLocaleString("es-AR")}`}</div>
              </div>
              <LugarBadge planId={a.plan}/>
              <Btn variant={p?"success":"danger"} size="sm" onClick={()=>toggle(a.id,a.plan)}>{p?"✓ Pagó":"Pendiente"}</Btn>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RANKING
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const VistaRanking = ({alumnos,asistencia,usuario}) => {
  const mes=mesActual();
  const activos=alumnos.filter(a=>a.activo&&a.aprobado);
  const ranking=activos.map(a=>{
    const pres=Object.keys(asistencia).filter(k=>{const[f,p,id]=k.split("__");return f.slice(0,7)===mes&&p===a.plan&&id==a.id;}).length;
    return {...a,pres,score:(a.antiguedadMeses||0)*100+pres};
  }).sort((a,b)=>b.score-a.score);

  const medallas=["🥇","🥈","🥉"];
  const esYo=a=>usuario.rol==="alumno"&&a.id===usuario.id;

  return (
    <div>
      <Card style={{marginBottom:14,padding:12,background:C.accent+"0A",borderColor:C.accent+"33"}}>
        <div style={{color:C.accent,fontSize:12,fontWeight:700}}>🏆 Ranking por antigüedad en meses + presencias del mes actual</div>
      </Card>
      <div style={{display:"flex",flexDirection:"column",gap:7}}>
        {ranking.map((a,i)=>{
          const premio=premioActual(a.antiguedadMeses||0);
          return (
            <Card key={a.id} style={{display:"flex",alignItems:"center",gap:10,padding:"12px 14px",
              borderColor:esYo(a)?C.accent+"88":i<3?C.yellow+"44":C.border,background:esYo(a)?C.accent+"08":C.card}}>
              <div style={{width:32,textAlign:"center",fontSize:i<3?22:14,color:i<3?C.yellow:C.textMuted,fontWeight:800}}>{i<3?medallas[i]:`#${i+1}`}</div>
              <Av nombre={a.nombre} size={34}/>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:C.textPrimary,fontWeight:esYo(a)?800:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {a.nombre} {esYo(a)&&<span style={{color:C.accent}}>(vos)</span>}
                </div>
                <div style={{color:C.textMuted,fontSize:11}}>{a.pres} presencias este mes{premio?` · ${premio.emoji}${premio.label}`:""}</div>
              </div>
              <LugarBadge planId={a.plan}/>
              <Badge color={C.purple}>{a.antiguedadMeses||0}m</Badge>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PREMIOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const VistaPremios = ({alumnos,usuario}) => {
  const esAdmin=usuario.rol==="admin";
  const mesesPropios=esAdmin?0:(alumnos.find(a=>a.id===usuario.id)?.antiguedadMeses||0);

  return (
    <div>
      <Card style={{marginBottom:16,padding:16,background:C.accent+"0A",borderColor:C.accent+"33"}}>
        <div style={{color:C.accent,fontWeight:800,fontSize:16,marginBottom:4}}>🏆 Premios por constancia</div>
        <div style={{color:C.textSecondary,fontSize:13}}>Estos son los premios que ganás por seguir entrenando mes a mes en United.</div>
      </Card>

      {!esAdmin&&(
        <Card style={{marginBottom:16,padding:14,borderColor:C.purple+"44"}}>
          <div style={{color:C.purple,fontWeight:700,fontSize:13,marginBottom:8}}>Tu progreso actual — {mesesPropios} meses</div>
          <div style={{background:C.border,borderRadius:6,height:10,overflow:"hidden",marginBottom:8}}>
            <div style={{width:`${Math.min(100,(mesesPropios/48)*100)}%`,height:"100%",background:C.accent,borderRadius:6}}/>
          </div>
          {premioActual(mesesPropios)&&<div style={{color:C.green,fontSize:12}}>✅ Premio actual: {premioActual(mesesPropios).emoji} {premioActual(mesesPropios).label}</div>}
          {proximoPremio(mesesPropios)&&<div style={{color:C.textSecondary,fontSize:12}}>🎯 Próximo: {proximoPremio(mesesPropios).emoji} {proximoPremio(mesesPropios).label} en {proximoPremio(mesesPropios).meses-mesesPropios} meses</div>}
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {PREMIOS.map(p=>{
          const alcanzado=!esAdmin&&mesesPropios>=p.meses;
          return (
            <Card key={p.meses} style={{display:"flex",alignItems:"center",gap:14,padding:16,
              borderColor:alcanzado?p.color+"66":C.border,
              background:alcanzado?p.color+"08":C.card,
              opacity:esAdmin?1:(mesesPropios<p.meses?0.5:1)}}>
              <div style={{fontSize:36,flexShrink:0}}>{p.emoji}</div>
              <div style={{flex:1}}>
                <div style={{color:alcanzado?p.color:C.textPrimary,fontWeight:700,fontSize:15}}>{p.label}</div>
                <div style={{color:C.textSecondary,fontSize:12}}>
                  {p.meses<12?`${p.meses} meses`:p.meses===12?"1 año":p.meses<24?`1 año y ${p.meses-12} meses`:`${Math.floor(p.meses/12)} años${p.meses%12?` y ${p.meses%12} meses`:""}`} de constancia
                </div>
              </div>
              {alcanzado&&<Badge color={p.color}>✓ Ganado</Badge>}
              {!esAdmin&&!alcanzado&&<Badge color={C.textMuted}>{p.meses-mesesPropios}m más</Badge>}
            </Card>
          );
        })}
      </div>

      {esAdmin&&(
        <Card style={{marginTop:16,padding:14,background:C.yellow+"08",borderColor:C.yellow+"44"}}>
          <div style={{color:C.yellow,fontWeight:700,fontSize:13,marginBottom:4}}>📸 Próximamente</div>
          <div style={{color:C.textSecondary,fontSize:12}}>Podrás cargar fotos de cada premio desde el panel de administración.</div>
        </Card>
      )}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AVISOS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const VistaAvisos = ({avisos,setAvisos,esAdmin}) => {
  const [modal,setModal]=useState(false);
  const [form,setForm]=useState({titulo:"",cuerpo:"",tipo:"info"});
  const tipos={info:{color:C.blue,label:"Info"},aviso:{color:C.yellow,label:"Aviso"},urgente:{color:C.red,label:"Urgente"},logro:{color:C.green,label:"Logro"}};
  const guardar=()=>{if(!form.titulo.trim()) return;setAvisos(prev=>[{...form,id:Date.now(),fecha:hoy()},...prev]);setModal(false);setForm({titulo:"",cuerpo:"",tipo:"info"});};
  return (
    <div>
      {esAdmin&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:12}}><Btn onClick={()=>setModal(true)}><Ic p={I.plus} s={14}/> Nuevo aviso</Btn></div>}
      {avisos.length===0&&<div style={{color:C.textMuted,textAlign:"center",padding:40}}>Sin avisos publicados</div>}
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {avisos.map(a=>{const t=tipos[a.tipo]||tipos.info;return(
          <Card key={a.id} style={{borderLeft:`4px solid ${t.color}`}}>
            <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:8,marginBottom:4}}><Badge color={t.color}>{t.label}</Badge><span style={{color:C.textMuted,fontSize:11}}>{fmtFecha(a.fecha)}</span></div>
                <div style={{color:C.textPrimary,fontWeight:700,fontSize:15,marginBottom:2}}>{a.titulo}</div>
                {a.cuerpo&&<div style={{color:C.textSecondary,fontSize:13,lineHeight:1.5}}>{a.cuerpo}</div>}
              </div>
              {esAdmin&&<Btn variant="danger" size="sm" onClick={()=>setAvisos(prev=>prev.filter(x=>x.id!==a.id))}><Ic p={I.trash} s={13}/></Btn>}
            </div>
          </Card>
        );})}
      </div>
      {modal&&(
        <Modal title="Nuevo aviso" onClose={()=>setModal(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>{Object.entries(tipos).map(([k,v])=><Btn key={k} size="sm" variant={form.tipo===k?"primary":"ghost"} style={form.tipo===k?{background:v.color,color:"#fff"}:{}} onClick={()=>setForm(f=>({...f,tipo:k}))}>{v.label}</Btn>)}</div>
            <Inp value={form.titulo} onChange={v=>setForm(f=>({...f,titulo:v}))} placeholder="Título"/>
            <textarea value={form.cuerpo} onChange={e=>setForm(f=>({...f,cuerpo:e.target.value}))} placeholder="Descripción..." style={{width:"100%",minHeight:70,background:C.bg,border:`1px solid ${C.border}`,borderRadius:8,color:C.textPrimary,padding:"8px 12px",fontSize:13,fontFamily:"inherit",outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}><Btn variant="ghost" onClick={()=>setModal(false)}>Cancelar</Btn><Btn onClick={guardar}><Ic p={I.send} s={13}/> Publicar</Btn></div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PERFIL ALUMNO (self)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const PerfilPropio = ({usuario,alumnos,asistencia,pagos}) => {
  const a=alumnos.find(x=>x.id===usuario.id);
  if(!a) return null;
  const mes=mesActual();
  const plan=planInfo(a.plan);
  const pagado=!!pagos[`${a.id}__${mes}`];
  const presentesMes=Object.keys(asistencia).filter(k=>{const[f,p,id]=k.split("__");return f.slice(0,7)===mes&&p===a.plan&&id==a.id;}).length;
  const posibles=diasPosiblesHastaHoy(a.plan,mes);
  const pct=posibles?Math.min(100,Math.round(presentesMes/posibles*100)):0;
  const pctColor=v=>v>=80?C.green:v>=50?C.yellow:C.red;
  const premio=premioActual(a.antiguedadMeses||0);
  const proximo=proximoPremio(a.antiguedadMeses||0);

  const todosRegistros=Object.entries(asistencia)
    .filter(([k])=>{const[,p,id]=k.split("__");return p===a.plan&&id==a.id;})
    .map(([k,v])=>{const[fecha]=k.split("__");return{fecha,hora:v?.hora||""};})
    .sort((a,b)=>b.fecha.localeCompare(a.fecha));

  const mesesHist={};
  todosRegistros.forEach(r=>{
    const m=r.fecha.slice(0,7);
    if(!mesesHist[m]) mesesHist[m]={presentes:0,total:diasPosiblesEnMes(a.plan,m),pct:0,registros:[]};
    mesesHist[m].presentes++;
    mesesHist[m].registros.push(r);
  });
  Object.keys(mesesHist).forEach(m=>{mesesHist[m].pct=mesesHist[m].total?Math.min(100,Math.round(mesesHist[m].presentes/mesesHist[m].total*100)):0;});
  const histCompleto={...mesesHist,...(a.historialAsistencia||{})};

  return (
    <div>
      <Card style={{marginBottom:14,padding:18}}>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <Av nombre={a.nombre} size={52}/>
          <div style={{flex:1}}>
            <div style={{color:C.textPrimary,fontWeight:800,fontSize:18}}>{a.nombre}</div>
            <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
              <PlanBadge planId={a.plan}/>
              <Badge color={C.purple}>{a.antiguedadMeses||0} meses</Badge>
              <Badge color={pagado?C.green:C.red}>{pagado?"Cuota al día":"Cuota pendiente"}</Badge>
            </div>
          </div>
        </div>
        {a.objetivo&&(
          <div style={{marginTop:12,padding:"8px 12px",background:C.accent+"0A",borderRadius:8,borderLeft:`3px solid ${C.accent}`}}>
            <div style={{color:C.accent,fontSize:11,fontWeight:700}}>🎯 MI OBJETIVO</div>
            <div style={{color:C.textSecondary,fontSize:13}}>{a.objetivo}</div>
          </div>
        )}
      </Card>

      {(premio||proximo)&&(
        <Card style={{marginBottom:14,padding:14}}>
          {premio&&<div style={{display:"flex",gap:10,alignItems:"center",padding:"8px 12px",background:premio.color+"11",borderRadius:8,marginBottom:8}}><span style={{fontSize:24}}>{premio.emoji}</span><div><div style={{color:premio.color,fontWeight:800,fontSize:13}}>{premio.label}</div><div style={{color:C.textMuted,fontSize:11}}>{premio.meses} meses de constancia</div></div></div>}
          {proximo&&<div style={{color:C.textMuted,fontSize:12}}>🎯 Próximo: {proximo.emoji} {proximo.label} en <strong style={{color:C.accent}}>{proximo.meses-(a.antiguedadMeses||0)} meses</strong></div>}
        </Card>
      )}

      <Card style={{marginBottom:14,padding:16}}>
        <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:10,textTransform:"uppercase",letterSpacing:.5}}>Asistencia — {fmtMes(mes)}</div>
        <div style={{display:"flex",gap:14,alignItems:"center"}}>
          <Ring pct={pct} size={80} color={pctColor(pct)}/>
          <div>
            <div style={{color:C.textPrimary,fontSize:26,fontWeight:800}}>{presentesMes}<span style={{color:C.textMuted,fontSize:15}}>/{posibles} días</span></div>
            <div style={{color:C.textSecondary,fontSize:12}}>{plan.horaLabel} — {plan.lugar===LUGAR.MER?"Mercado del Patio":"Parque Independencia"}</div>
          </div>
        </div>
      </Card>

      <Card>
        <div style={{color:C.textMuted,fontSize:11,fontWeight:700,marginBottom:12,textTransform:"uppercase",letterSpacing:.5}}>Mi historial completo</div>
        {Object.keys(histCompleto).length===0?<div style={{color:C.textMuted,fontSize:13}}>Sin registros aún</div>
          :Object.keys(histCompleto).sort((a,b)=>b.localeCompare(a)).map(m=>{
            const d=histCompleto[m];
            return (
              <div key={m} style={{marginBottom:8,paddingBottom:8,borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{color:C.textSecondary,fontSize:12,minWidth:72}}>{fmtMes(m)}</span>
                  <div style={{flex:1,background:C.border,borderRadius:3,height:5}}>
                    <div style={{width:`${d.pct}%`,height:"100%",borderRadius:3,background:pctColor(d.pct)}}/>
                  </div>
                  <Badge color={pctColor(d.pct)}>{d.pct}%</Badge>
                  <span style={{color:C.textMuted,fontSize:10}}>{d.presentes}/{d.total}</span>
                </div>
              </div>
            );
          })}
      </Card>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSTALL PWA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const VistaInstalar = () => (
  <div style={{display:"flex",flexDirection:"column",gap:14,maxWidth:440,margin:"0 auto"}}>
    <Card style={{textAlign:"center",padding:28}}>
      <div style={{fontSize:48,marginBottom:12}}>📱</div>
      <div style={{color:C.textPrimary,fontWeight:800,fontSize:18,marginBottom:8}}>Instalá United en tu celular</div>
      <div style={{color:C.textSecondary,fontSize:13,lineHeight:1.6}}>Funciona como app sin necesidad de la tienda. Instalala en segundos.</div>
    </Card>
    {[
      {titulo:"Android (Chrome)",emoji:"🤖",pasos:["Abrí esta página en Chrome","Tocá el menú ⋮ arriba a la derecha","Elegí "Agregar a pantalla de inicio"","Confirmá tocando "Agregar"","¡Listo! Aparece el ícono de United en tu pantalla"]},
      {titulo:"iPhone (Safari)",emoji:"🍎",pasos:["Abrí esta página en Safari","Tocá el botón compartir 🔗 (abajo al centro)","Deslizá y elegí "Agregar a pantalla de inicio"","Tocá "Agregar" arriba a la derecha","¡Listo! Funciona como app nativa"]},
    ].map(({titulo,emoji,pasos})=>(
      <Card key={titulo} style={{padding:18}}>
        <div style={{fontWeight:800,fontSize:15,color:C.textPrimary,marginBottom:12}}>{emoji} {titulo}</div>
        {pasos.map((p,i)=>(
          <div key={i} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
            <div style={{width:22,height:22,borderRadius:"50%",background:C.accent,color:C.accentText,fontWeight:800,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
            <div style={{color:C.textSecondary,fontSize:13,lineHeight:1.5,paddingTop:2}}>{p}</div>
          </div>
        ))}
      </Card>
    ))}
    <Card style={{padding:14,background:C.accent+"08",borderColor:C.accent+"33"}}>
      <div style={{color:C.accent,fontWeight:700,fontSize:13,marginBottom:4}}>💡 Una vez instalada</div>
      <div style={{color:C.textSecondary,fontSize:13,lineHeight:1.5}}>Se abre sin barra del navegador, con pantalla completa, igual que una app descargada de la tienda. Funciona en iPhone y Android.</div>
    </Card>
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// APP ROOT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const SEED_ALUMNOS=[
  {id:1,nombre:"Lucía Fernández",email:"lucia@mail.com",pass:"1234",plan:"man3",telefono:"341-111-2233",objetivo:"Bajar de peso y mejorar resistencia cardio",cumpleanos:"1995-03-15",activo:true,aprobado:true,fechaIngreso:"2023-06-01",antiguedadMeses:24,historialAsistencia:{"2025-04":{presentes:11,total:12,pct:92},"2025-05":{presentes:10,total:12,pct:83}}},
  {id:2,nombre:"Martín Gómez",email:"martin@mail.com",pass:"1234",plan:"ind4",telefono:"341-222-3344",objetivo:"Ganar masa muscular y fuerza",cumpleanos:"1990-06-26",activo:true,aprobado:true,fechaIngreso:"2024-01-01",antiguedadMeses:17,historialAsistencia:{"2025-05":{presentes:14,total:16,pct:88}}},
  {id:3,nombre:"Valentina Ríos",email:"vale@mail.com",pass:"1234",plan:"mer2",telefono:"341-333-4455",objetivo:"Mantener el peso y mejorar flexibilidad",cumpleanos:"1998-11-08",activo:true,aprobado:true,fechaIngreso:"2024-06-01",antiguedadMeses:12,historialAsistencia:{}},
  {id:4,nombre:"Gonzalo Peralta",email:"gonza@mail.com",pass:"1234",plan:"ind3",telefono:"341-444-5566",objetivo:"Preparación para maratón",cumpleanos:"1993-08-20",activo:true,aprobado:true,fechaIngreso:"2025-01-01",antiguedadMeses:5,historialAsistencia:{}},
];

export default function App() {
  const [alumnos,    setAlumnos]    = useLS("un3_alumnos",  SEED_ALUMNOS);
  const [pendientes, setPendientes] = useLS("un3_pend",     []);
  const [asistencia, setAsistencia] = useLS("un3_asist",    {});
  const [pagos,      setPagos]      = useLS("un3_pagos",    {});
  const [avisos,     setAvisos]     = useLS("un3_avisos",   []);
  const [usuario,    setUsuario]    = useState(null);
  const [vista,      setVista]      = useState("dashboard");
  const [alumnoDetalle, setAlumnoDetalle] = useState(null);

  // Notificación cumpleaños
  useEffect(()=>{
    if(!usuario) return;
    const mesH=today.getMonth()+1, diaH=today.getDate();
    const hoyBday=alumnos.find(a=>a.aprobado&&a.cumpleanos&&+a.cumpleanos.split("-")[1]===mesH&&+a.cumpleanos.split("-")[2]===diaH);
    if(hoyBday&&usuario.rol==="admin"){
      setTimeout(()=>{ if(Notification.permission==="granted") new Notification(`🎂 Hoy es el cumple de ${hoyBday.nombre}!`,{body:"¡No olvides saludar a tu alumno!"}); },1000);
    }
    if(usuario.rol==="alumno"&&usuario.cumpleanos){
      const[,m,d]=usuario.cumpleanos.split("-").map(Number);
      if(m===mesH&&d===diaH){ setTimeout(()=>{ if(Notification.permission==="granted") new Notification("🎉 ¡Feliz cumpleaños!",{body:`¡Feliz cumple ${usuario.nombre}! Todo el equipo United te desea lo mejor 💪`}); },1500); }
    }
    Notification.requestPermission();
  },[usuario]);

  if(!usuario) return <AuthScreen onLogin={u=>{setUsuario(u);setVista(u.rol==="admin"?"dashboard":"qr");}} setPendientes={setPendientes} allAlumnos={[...alumnos,...pendientes]}/>;

  const esAdmin=usuario.rol==="admin";

  const TABS_ADMIN=[
    {id:"dashboard",  label:"Inicio",      icon:I.chart},
    {id:"qr",         label:"QR",          icon:I.qr},
    {id:"alumnos",    label:"Alumnos",     icon:I.users},
    {id:"asistencia", label:"Asistencia",  icon:I.check},
    {id:"pagos",      label:"Pagos",       icon:I.dollar},
    {id:"ranking",    label:"Ranking",     icon:I.trophy},
    {id:"premios",    label:"Premios",     icon:I.medal},
    {id:"avisos",     label:"Avisos",      icon:I.bell},
  ];
  const TABS_ALUMNO=[
    {id:"qr",       label:"Asistencia", icon:I.check},
    {id:"perfil",   label:"Mi perfil",  icon:I.person},
    {id:"ranking",  label:"Ranking",    icon:I.trophy},
    {id:"premios",  label:"Premios",    icon:I.medal},
    {id:"avisos",   label:"Avisos",     icon:I.bell},
    {id:"instalar", label:"App",        icon:I.down},
  ];
  const tabs=esAdmin?TABS_ADMIN:TABS_ALUMNO;

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"'Inter','Segoe UI',sans-serif",color:C.textPrimary}}>
      {/* Header */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 14px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex",alignItems:"center",gap:10,height:54}}>
          <img src={`data:image/png;base64,${LOGO_B64}`} alt="United" style={{width:36,height:36,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.accent}`}}/>
          <div>
            <div style={{fontWeight:900,fontSize:14,color:C.accent,letterSpacing:1,lineHeight:1}}>UNITED</div>
            <div style={{fontSize:9,color:C.textMuted,letterSpacing:1}}>ENTRENAMIENTOS</div>
          </div>
          <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
            {esAdmin&&pendientes.length>0&&<Badge color={C.yellow}>⚠ {pendientes.length}</Badge>}
            <Badge color={esAdmin?C.accent:C.blue}>{esAdmin?"Admin":usuario.nombre?.split(" ")[0]}</Badge>
            <Btn variant="ghost" size="sm" onClick={()=>{setUsuario(null);setVista("dashboard");}}>Salir</Btn>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <div style={{maxWidth:900,margin:"0 auto",display:"flex"}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>{setVista(t.id);setAlumnoDetalle(null);}}
              style={{background:"none",border:"none",cursor:"pointer",padding:"10px 12px",display:"flex",alignItems:"center",gap:4,fontSize:11,fontWeight:vista===t.id?800:500,fontFamily:"inherit",color:vista===t.id?C.accent:C.textSecondary,borderBottom:vista===t.id?`2px solid ${C.accent}`:"2px solid transparent",whiteSpace:"nowrap"}}>
              <Ic p={t.icon} s={13} c={vista===t.id?C.accent:C.textMuted}/>{t.label}
              {t.id==="alumnos"&&pendientes.length>0&&<span style={{background:C.yellow,color:C.accentText,borderRadius:8,padding:"0 4px",fontSize:9,fontWeight:800}}>{pendientes.length}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:900,margin:"0 auto",padding:"16px 14px 60px"}}>
        {vista==="alumnoDetalle"&&<AlumnoDetalle alumnoId={alumnoDetalle} alumnos={alumnos} asistencia={asistencia} pagos={pagos} onBack={()=>{setVista("alumnos");setAlumnoDetalle(null);}}/>}
        {vista==="dashboard" &&esAdmin&&<AdminDashboard alumnos={alumnos} asistencia={asistencia} pagos={pagos} pendientes={pendientes}/>}
        {vista==="qr"        &&<VistaQR asistencia={asistencia} setAsistencia={setAsistencia} alumnos={alumnos} usuario={usuario}/>}
        {vista==="alumnos"   &&esAdmin&&<AdminAlumnos alumnos={alumnos} setAlumnos={setAlumnos} pendientes={pendientes} setPendientes={setPendientes} asistencia={asistencia} pagos={pagos} setVista={setVista} setAlumnoDetalle={setAlumnoDetalle}/>}
        {vista==="asistencia"&&esAdmin&&<AdminAsistencia alumnos={alumnos} asistencia={asistencia} setAsistencia={setAsistencia}/>}
        {vista==="pagos"     &&esAdmin&&<AdminPagos alumnos={alumnos} pagos={pagos} setPagos={setPagos}/>}
        {vista==="ranking"   &&<VistaRanking alumnos={alumnos} asistencia={asistencia} usuario={usuario}/>}
        {vista==="premios"   &&<VistaPremios alumnos={alumnos} usuario={usuario}/>}
        {vista==="avisos"    &&<VistaAvisos avisos={avisos} setAvisos={setAvisos} esAdmin={esAdmin}/>}
        {vista==="perfil"    &&!esAdmin&&<PerfilPropio usuario={usuario} alumnos={alumnos} asistencia={asistencia} pagos={pagos}/>}
        {vista==="instalar"  &&!esAdmin&&<VistaInstalar/>}
      </div>
    </div>
  );
}
