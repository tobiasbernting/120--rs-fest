// Enkel countdown, formvalidering, lokal backup och ICS-fil
(function(){
  const eventDate = new Date('2025-10-25T16:00:00Z'); // 18:00 svensk tid (UTC+2 sommartid, men i slutet av okt: normaltid? just nice approx)
  const countdownEl = document.getElementById('countdown');
  function tick(){
    const now = new Date();
    const diff = eventDate - now;
    if(diff <= 0){ countdownEl.textContent = "Det är fest!"; return; }
    const d = Math.floor(diff / (1000*60*60*24));
    const h = Math.floor((diff / (1000*60*60)) % 24);
    const m = Math.floor((diff / (1000*60)) % 60);
    countdownEl.textContent = `Nedräkning: ${d} dagar, ${h} timmar, ${m} min`;
  }
  tick(); setInterval(tick, 60*1000);

  const form = document.getElementById('rsvpForm');
  const status = document.getElementById('formStatus');
  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    status.className = 'status';
    status.textContent = 'Skickar…';

    // enkel validering
    const data = new FormData(form);
    const required = ['namn','epost','antal'];
    for (const key of required) {
      if(!data.get(key)) {
        status.className = 'status warn';
        status.textContent = 'Fyll i alla obligatoriska fält.';
        return;
      }
    }

    try{
      const resp = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: data
      });
      if(resp.ok){
        status.className = 'status ok';
        status.textContent = 'Tack! Din anmälan är mottagen.';
        localStorage.removeItem('rsvpBackup');
        form.reset();
        window.location.href = 'thanks.html'; // Redirect on success
      }else{
        const text = await resp.text();
        throw new Error(text || 'Något gick fel.');
      }
    }catch(err){
      status.className = 'status err';
      status.textContent = 'Kunde inte skicka formuläret. Testa igen senare eller spara lokalt nedan.';
      console.error(err);
    }
  });

  // Lokal backup
  const saveBtn = document.getElementById('saveLocalBtn');
  saveBtn.addEventListener('click', ()=>{
    const data = new FormData(form);
    const obj = {};
    data.forEach((v,k)=>obj[k]=v);
    localStorage.setItem('rsvpBackup', JSON.stringify(obj));
    status.className = 'status ok';
    status.textContent = 'Sparat lokalt på denna enhet.';
  });

  // Förifyll om det finns backup
  const backup = localStorage.getItem('rsvpBackup');
  if(backup){
    try{
      const obj = JSON.parse(backup);
      for(const [k,v] of Object.entries(obj)){
        const el = form.elements[k];
        if(el) el.value = v;
      }
      status.className = 'status warn';
      status.textContent = 'Vi hittade en sparad anmälan – kontrollera och skicka!';
    }catch{}
  }

  // ICS: skapa och ladda ner
  document.getElementById('addToCalendarBtn').addEventListener('click', ()=>{
    const dtStart = '20251025T180000';
    const dtEnd = '20251026T010000';
    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//120-årsfest//SV\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nBEGIN:VEVENT\nUID:120arsfest-2025-10-25@gff-garden\nDTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').split('.')[0]}Z\nDTSTART;TZID=Europe/Stockholm:${dtStart}\nDTEND;TZID=Europe/Stockholm:${dtEnd}\nSUMMARY:Vår gemensamma 120-årsfest\nLOCATION:GFF-gården, Majvallen, Göteborg\nDESCRIPTION:Tre vänner firar 40+40+40 – välkommen! Se detaljer och OSA på sidan.\nEND:VEVENT\nEND:VCALENDAR`;
    const blob = new Blob([ics], {type: 'text/calendar;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = '120-arsfest.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
  });
})();