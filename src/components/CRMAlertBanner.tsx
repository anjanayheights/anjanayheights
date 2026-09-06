import { useEffect, useState } from 'react';

type Lead={id:string;name?:string;phone?:string;created_at:string};
type Meta={status?:string;priority?:string;followUp?:string};
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const dateOnly=(v?:string)=>String(v||'').slice(0,10);

export default function CRMAlertBanner(){
  const [alert,setAlert]=useState<{overdue:Lead[];due:Lead[];hot:Lead[]}|null>(null);
  useEffect(()=>{
    const password=sessionStorage.getItem('crm_password')||'';
    if(!password)return;
    let cancelled=false;
    (async()=>{
      try{
        const h={Authorization:`Bearer ${password}`};
        const [lr,mr]=await Promise.all([fetch('/api/leads',{headers:h,cache:'no-store'}),fetch('/api/lead-meta',{headers:h,cache:'no-store'})]);
        if(!lr.ok||!mr.ok)return;
        const ld=await lr.json(); const md=await mr.json(); const leads:Lead[]=ld.leads||[]; const meta:Record<string,Meta>=md.meta||{}; const t=today();
        const active=leads.filter(l=>!['Closed','Lost'].includes(meta[l.id]?.status||''));
        const overdue=active.filter(l=>{const d=dateOnly(meta[l.id]?.followUp);return !!d&&d<t});
        const due=active.filter(l=>dateOnly(meta[l.id]?.followUp)===t);
        const hot=active.filter(l=>['Hot','Very Hot'].includes(meta[l.id]?.priority||''));
        if(!cancelled)setAlert({overdue,due,hot});
      }catch{}
    })();
    return()=>{cancelled=true};
  },[]);
  if(!alert || (!alert.overdue.length&&!alert.due.length&&!alert.hot.length))return null;
  const primary=alert.overdue.length?`🔴 ${alert.overdue.length} overdue follow-up${alert.overdue.length>1?'s':''} — call these first.`:alert.due.length?`📅 ${alert.due.length} follow-up${alert.due.length>1?'s':''} due today.`:`🔥 ${alert.hot.length} Hot/Very Hot lead${alert.hot.length>1?'s':''} need attention.`;
  return <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4"><div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3"><div><p className="font-bold text-red-800">Action Required</p><p className="text-sm text-red-700 mt-0.5">{primary}</p></div><div className="flex gap-2"><a href="/admin/daily-followups" className="rounded-lg bg-[#1A365D] text-white px-3 py-2 text-xs font-semibold">Open Follow-ups</a><a href="/admin/workspace" className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-700">Control Center</a></div></div></div>;
}
