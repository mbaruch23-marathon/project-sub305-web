// Project Sub-3:05 — deterministic, no-cost training guidance.
// Recommendations are conservative heuristics, not medical or professional assessment.
export function makeWeek(activities, now = new Date()) {
  const dayMs=86400000, today=new Date(now);today.setHours(0,0,0,0);
  const runs=activities.filter(a=>/run/i.test(a.activity_type||'')).map(a=>({date:new Date(String(a.activity_date).slice(0,10)+'T12:00:00'),mi:Number(a.distance_meters||0)/1609.344})).filter(a=>Number.isFinite(a.mi)&&a.mi>=0);
  const sum=(lo,hi)=>runs.filter(a=>{const age=(today-a.date)/dayMs;return age>=lo&&age<hi}).reduce((s,a)=>s+a.mi,0);
  const last7=sum(0,7),prior7=sum(7,14),last28=sum(0,28),weeklyBaseline=last28/4;
  const hasHistory=runs.filter(a=>(today-a.date)/dayMs<28).length>=8;
  const baseline=hasHistory?Math.max(12,weeklyBaseline):35;
  const ratio=prior7>=10?last7/prior7:null;
  const caution=ratio!==null&&ratio>1.3;
  const downshift=caution?0.8:1;
  const target=Math.round(Math.max(15,Math.min(55,baseline*downshift)));
  const race=new Date('2027-03-14T12:00:00');
  const weeks=Math.ceil((race-today)/dayMs/7);
  const phase=weeks>12?'Base development':weeks>4?'Marathon-specific build':weeks>2?'Peak / consolidation':weeks>0?'Taper':'Post-race recovery';
  const easy='Conversational effort; roughly 9:00–10:00/mi, adjust by feel';
  const templates=[
    {name:'Easy aerobic',share:.17,detail:easy},
    {name:'Quality session',share:.18,detail:'Warm up 1–2 mi; 3 × 8 min controlled threshold with 3 min easy jog; cool down. Skip intensity if fatigued.'},
    {name:'Easy aerobic',share:.15,detail:easy},
    {name:'Medium-long aerobic',share:.19,detail:'Comfortable steady aerobic effort; no pace chasing'},
    {name:'Recovery / rest',share:0,detail:'Rest, mobility or optional easy 2–3 mi if fresh'},
    {name:'Long run',share:.27,detail:'Easy conversational effort; practice hydration and fueling'},
    {name:'Recovery',share:.04,detail:'Very easy shuffle or rest; pickleball counts as load'}
  ];
  const days=[];
  for(let i=0;i<7;i++){
    const d=new Date(today);d.setDate(today.getDate()+i);const day=d.getDay();
    const t=templates[day];let miles=Math.round(target*t.share*2)/2;
    if(t.name==='Long run')miles=Math.min(miles,16);
    if((caution||!hasHistory)&&t.name==='Quality session'){t===null;days.push({date:d,name:'Easy aerobic (cautious)',miles,detail:'Keep it easy while recent training load is uncertain or elevated.'});continue}
    if(weeks<=2&&weeks>0&&t.name==='Quality session')days.push({date:d,name:'Light sharpening',miles:Math.min(miles,5),detail:'Short relaxed strides only; prioritize recovery.'});
    else days.push({date:d,name:t.name,miles,detail:t.detail});
  }
  if(weeks<=2&&weeks>0){for(const d of days){d.miles=Math.round(d.miles*(weeks===1?.55:.75)*2)/2;if(d.name==='Long run')d.miles=Math.min(d.miles,weeks===1?8:12)}}
  if(weeks<=0){for(const d of days){d.name='Recovery / easy';d.miles=0;d.detail='Resume running based on recovery, not an automated target.'}}
  return {days,last7,prior7,target,phase,hasHistory,caution,ratio,reason:!hasHistory?'Limited recent running history: conservative provisional targets.':caution?'Recent 7-day mileage is more than 30% above the previous week; reduce load and remove intensity.':'Target based on your last 28 days of recorded running, with a conservative weekly cap.'};
}
