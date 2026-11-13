// v4.64: SIMOPS / work permit menu – English summary of the permit package the site lead supplied
// (work permit form 10-18438 .xlsm + work scheme for G0-D6710RX0). Content is taken from those files only; nothing is added.
(function () {
  const SO = window.SO = {};
  const P = {
    src: 'Work permit form 10-18438 (Excel) and work scheme "G0-D6710RX0" (attachment to the permit) – received 13.11.2026',
    facts: [['Permit No.', '10-18438'], ['Permit type / category', 'Other (category 2)'], ['Presence category', 'Cat. C'], ['Validity', '7 days'],
      ['Planned start', '13.11.2026 08:00'], ['Planned finish', '26.11.2026 20:00'], ['Facility', 'GPP (gas processing plant)'], ['Work location', 'Pipe racks G0-D67'],
      ['Work area', 'G0-02-120'], ['Equipment ID', 'G0-D6710RX0 – pipe rack of the amine and hot oil storage area'], ['Elevation / axes', '0 m to +14 m, axes A–B / 1–10'],
      ['Organisation', 'Rencons Heavy Industries LLC'], ['Crew size', '10 (allowed 2 to 15)'], ['Isolation', 'None – isolation not required'], ['Risk assessment level', 'Level 1'], ['Instrument safety override request', 'Not required'],
      ['Aerial work platform', '1048 HA 50, 14 m'], ['Work at height', 'Under this permit No. 18438']],
    roles: [['Requested / approved (facility manager role)', 'Karaoglu Baris – Chief engineer, commissioning and testing'], ['Area supervisor – certifies and issues the permit to work', 'Abdrykov Marat Delyusovich – Head of area'],
      ['Shift supervisor – agreed for approval', 'Myachin Aleksandr Sergeevich'], ['Work supervisor – accepts, suspends and closes the work', 'Khaitboev Khasanboy Saidabdullaevich – Work performer']],
    scope: ['Installation of cable trays and earthing elements', 'Pulling and fixing of cable lines', 'Installation of cable tags', 'Work at height using the aerial work platform', 'Tools in use: electric drill, screwdriver'],
    mat: ['Materials: cable trays and connecting parts; cable fixings and ties; bolts, nuts, washers; earthing strip and conductor; cable lugs and connectors; cable tags and marking materials; consumables.',
      'Tools: set of spanners and sockets; screwdrivers; pliers, side cutters; cable shears; insulation stripping tool; crimping pliers for lugs; electric drill, screwdriver; tape measure, level.',
      'Devices: mounting brackets and supports; clamps; cable rollers; cable pulling devices; slings and rigging; portable barriers and warning signs.'],
    haz: ['Fall of workers from height when working from the aerial platform', 'Fall of tools, materials and tray parts from height', 'Hand injury when cutting, installing and fixing cable trays', 'Cuts from sharp edges of metal trays',
      'Fall or shift of the aerial platform if it is set up wrongly', 'Trapping of hands and limbs when installing structures', 'Objects falling on workers below', 'Bad weather during work at height'],
    rules: ['Work only with an issued permit and after the task-specific briefing.', 'Before starting, check the aerial platform is in good order and its documents are available.', 'At height, wear the safety harness and attach it as shown in the aerial platform scheme.',
      'Fence the work zone and put up warning signs.', 'Nobody is allowed under the place where work at height is going on.', 'Before starting, check there is no voltage on the cable route sections where this is required.',
      'Secure tools and materials against falling from height.', 'Set the aerial platform on firm ground, within its permitted load and the weather limits.', 'Stop work at height in strong wind, rain or snow or other bad conditions.', 'Give every worker the required PPE.'],
    ppe: ['Workwear protecting against mechanical impact, short exposure to open flame and static electricity', 'Safety footwear', 'Helmet with adjustable chin strap', 'Self-rescuers', 'Multi-point safety harness, fire-resistant type', 'Safety goggles', 'Portable breathing device PDU-3 (5)',
      'Gas detector: TOP-SENS 310 (CH4 – H2S – CO – O2)', 'Harness: TECNOALP (TA50P R XXL), TECNOALP (ALN212 V)', 'Communication: radio (Motorola)'],
    risk: [['Hand tool injury', [['Keep a first-aid kit at the work place.', 1], ['Check hand tools and devices before work. Faulty tools must not be used.', 1], ['Wear safety goggles.', 0], ['Store and carry tools in closed boxes or tool backpacks.', 0], ['Place tools so they cannot roll or fall.', 1], ['Use spanners that match the nut and bolt size. No packing pieces in gaps.', 1], ['Keep fasteners in a suitable container.', 0]]],
      ['Fall of a worker from height', [['Install a protective barrier or rigid fence.', 1], ['Put up warning signs.', 1], ['Appoint a person responsible for access to the fenced zone.', 1], ['Watch the work zone all the time; no outsiders.', 0], ['Use a safety harness – always above 1.8 m.', 0], ['Check the fall-protection equipment before every use.', 1], ['Use a positioning system.', 0], ['Use standard scaffolding / platforms for access.', 0], ['Check the scaffold has a green tag before working from it.', 1], ['Inspect the scaffold before starting.', 1], ['Tie the top of a ladder to a stable structure before starting.', 1], ['From a ladder above 1.8 m use a safety belt.', 1], ['Attach the harness lanyard with stopper to an anchor point on the main structure.', 1]]],
      ['Fall from the lifting platform (basket)', [['No work in the basket in poor visibility (rain, snow, fog) or icing.', 0], ['No work in the basket at wind speed above 10 m/s.', 0], ['Stop in bad weather (rain, thunderstorm, wind).', 0], ['Attach the harness lanyard with stopper to the anchor point.', 1]]],
      ['Fall from height / objects blown by wind', [['100 % tie-off with two lanyards is mandatory. When moving, change the anchor points one after the other.', 0]]],
      ['Objects falling from height', [['Bring tools and materials to the work place so they cannot fall, spark or injure anyone (in a bag, on a rope).', 1], ['Install protection (decking, nets, canopies) when works are done one above the other on the same vertical.', 1], ['Use screens against falling objects.', 1], ['Secure equipment and tools at height.', 1], ['Use a special container / rope to lower and lift tools and equipment.', 1]]],
      ['Lifting platform accident', [['Use a separate rope with its own anchor for hanging tools / materials heavier than 10 kg.', 0]]],
      ['Evacuation', [['Make sure the evacuation routes are free.', 1]]],
      ['Poor lighting / tripping', [['At the end of work tidy the work place, remove tools and waste, and report the end of work to the work supervisor.', 1]]],
      ['Slips', [['No work on slippery, wet or icy surfaces.', 0]]],
      ['Gas / lack of oxygen', [['Test the air for explosive and flammable substances before starting and after any break longer than one hour.', 1]]]],
    brief: [['Plan and information', 'what the work is, its risks, each worker\'s role'], ['Equipment check', 'equipment used, how it is checked and prepared, what to do if it does not work normally'],
      ['Work place preparation', 'restricted zones, safety signs in use, simultaneous (joint) works'], ['Energy control and check', 'types of isolation, energy sources, safety system interlocks, isolated sensors and instruments'],
      ['Fire safety', 'combustible materials, ignition sources, fire-hazardous processes, where fire-fighting equipment is kept, evacuation routes, assembly points, fire alarm call points'],
      ['Start of work', 'how the crew feel, emergency contacts, communication protocol, life-saving rules, examples of incidents in similar work, what to do during the work, how often the dynamic risk assessment is repeated']],
    after: ['Every crew member signs the briefing card: "the task description and the risk assessment match the planned work".', 'The permit issuer and the specialist sign the card with date.',
      'Dynamic risk assessment: if conditions change, after a break, or if anything adds a new hazard – write down the change, the measures taken, and the work supervisor signs.',
      'Crew changes: every person added to or removed from the crew is recorded with qualification, signature, date and time, and allowed by the work supervisor. For work at height the responsible performer must be named.',
      'Gas test record: initial test and repeat (periodic) tests – detector serial number, date, time, sampling point, O2 %, % LEL methane, CO ppm, H2S ppm, name and signature. The repeat interval is set in the risk assessment.',
      'Completion: the work supervisor confirms at the work place that the work is finished, the crew has left and the site is left safe, clean and tidy.'],
    att: ['Facility manager (permit approver)', 'Work supervisor', 'Aerial platform operator', 'Work schemes G0-D6710RX0', 'Work locations', 'Method statement / technological card – familiarisation sheet',
      'Referenced documents: GSP-(G0-Z00000X0)-CT-MC-120.009 · GSP-(G0-Z00000X0)-CT-MC-120.014 · GSP-(G0-Z00000X0)-CT-MC-120 · GSP-(G0-Z00000X0)-HS-PR-007 · RHI-(G0-Z00000X0)-CT-MC-107'],
    docs: ['Risk assessment certificate', 'Task-specific briefing and per-shift admission certificate', 'Gas detector verification certificate (contractor)', 'General plan showing the work place and the evacuation routes',
      'Detailed scheme of the work place: module, room, floor, tier, fire-fighting equipment, hazardous zone boundary, air sampling points', 'Approved request to override safety / ESD systems (if applicable)', 'Gas / flame detector layout (if applicable)',
      'Industrial safety certification record of the person responsible for the work (contractor)', 'Copy of the order appointing the persons responsible for high-risk work (contractor)', 'Personal isolation scheme (if applicable)', 'Isolation certificate with isolation scheme and air sampling points (if applicable)', 'Air analysis certificate (if applicable)'],
    simops: ['Tell the crew at the briefing where the restricted zones are, which safety signs are used, and which other works run at the same time (briefing stage 3).', 'When works are done one above the other on the same vertical, install decking, nets or canopies first.',
      'Nobody under the place of work at height; fence the zone, put signs, and appoint one person responsible for access.', 'Keep the evacuation routes free and know the assembly point shown on the work scheme.',
      'If another team starts work nearby or conditions change, stop and record it in the dynamic risk assessment before continuing.']
  };
  const li = L => `<ul style="margin:4px 0 0 18px;padding:0;font-size:13.5px;line-height:1.45">${L.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
  const card = (t, body, col) => `<div class="card" style="${col ? 'border-left:5px solid ' + col : ''}"><div class="h3">${t}</div>${body}</div>`;
  SO.tile = function () { return `<button class="tile main" style="min-height:auto;width:100%;margin-bottom:6px;background:#8a1c1c;border-color:#8a1c1c;color:#fff" onclick="go('#/so')"><b>⛑ SIMOPS / WORK PERMIT – WHAT TO FOLLOW</b><span class="n" style="color:#f6dede">permit 10-18438 · work at height · rules, PPE, briefing</span></button>`; };
  SO.view = function () { setHead('SIMOPS / work permit', 'Permit 10-18438 · G0-D6710RX0 · what we must follow');
    main.innerHTML = `<div class="chips"><button class="chip on" onclick="window.print()">🖨 Print</button><button class="chip" onclick="SO.excel()">📊 Excel</button></div>
     ${card('⚠ Simultaneous works – keep in mind', li(P.simops), '#b42318')}
     ${card('Permit at a glance', `<table style="width:100%;border-collapse:collapse;font-size:13px">${P.facts.map(f => `<tr><td style="padding:3px 6px 3px 0;color:var(--mut);width:42%;vertical-align:top">${esc(f[0])}</td><td style="padding:3px 0"><b>${esc(f[1])}</b></td></tr>`).join('')}</table>`)}
     ${card('Who signs what', `<table style="width:100%;border-collapse:collapse;font-size:13px">${P.roles.map(f => `<tr><td style="padding:3px 6px 3px 0;color:var(--mut);width:50%;vertical-align:top">${esc(f[0])}</td><td style="padding:3px 0">${esc(f[1])}</td></tr>`).join('')}</table>`)}
     ${card('Scope of work', li(P.scope) + `<div style="margin-top:6px;font-size:12.5px;color:var(--mut)">${P.mat.map(esc).join('<br>')}</div>`)}
     ${card('Special hazards', li(P.haz), '#d97706')}
     ${card('Rules for this work', li(P.rules), '#1f7a3a')}
     ${card('PPE and equipment required', li(P.ppe))}
     ${card('Risk assessment – control measures', P.risk.map(g => `<div style="font-weight:700;margin-top:8px;font-size:13.5px">${esc(g[0])}</div><ul style="margin:2px 0 0 18px;padding:0;font-size:13px;line-height:1.4">${g[1].map(c => `<li>${esc(c[0])}${c[1] ? ' <span style="color:#1f7a3a;font-weight:700;white-space:nowrap">· before start</span>' : ''}</li>`).join('')}</ul>`).join('') + '<div class="foot" style="text-align:left">"before start" = marked as a preliminary measure in the permit risk assessment.</div>')}
     ${card('Briefing before the work (6 stages)', `<ol style="margin:4px 0 0 18px;padding:0;font-size:13.5px;line-height:1.45">${P.brief.map(b => `<li><b>${esc(b[0])}</b> – ${esc(b[1])}</li>`).join('')}</ol>`)}
     ${card('Records to keep during the work', li(P.after))}
     ${card('Attachments listed in the permit', li(P.att))}
     ${card('Documents to submit with a high-risk work permit', li(P.docs) + '<div class="foot" style="text-align:left">From the checklist sheet of the permit form (high-risk work / potential sparking).</div>')}
     ${card('Work scheme – G0-D6710RX0', `<div style="font-size:13px">Legend: green line = personnel routes / evacuation routes · green box = place of work · green sign = assembly point.</div><img src="simops_scheme.jpg" alt="Work scheme G0-D6710RX0" style="width:100%;margin-top:6px;border:1px solid var(--line)">`)}
     <div class="foot">Source: ${esc(P.src)}. English summary for the crew – the signed Russian permit is the valid document. Note: the work scheme is marked as attachment to permit No. 10-18462, the form is No. 10-18438 – check which number is correct.</div>`; };
  SO.excel = function () { if (!window.XL) return toast('Excel module not loaded'); const R = [['SIMOPS / work permit 10-18438 – G0-D6710RX0 – what to follow'], [P.src], []];
    const sec = (t, L) => { R.push([t]); L.forEach((x, i) => R.push([i + 1, x])); R.push([]); };
    sec('Simultaneous works', P.simops); R.push(['Permit at a glance']); P.facts.forEach(f => R.push([f[0], f[1]])); R.push([]); R.push(['Who signs what']); P.roles.forEach(f => R.push([f[0], f[1]])); R.push([]);
    sec('Scope of work', P.scope.concat(P.mat)); sec('Special hazards', P.haz); sec('Rules for this work', P.rules); sec('PPE and equipment', P.ppe);
    R.push(['Risk assessment – control measures']); P.risk.forEach(g => g[1].forEach(c => R.push([g[0], c[0], c[1] ? 'before start' : '']))); R.push([]);
    sec('Briefing – 6 stages', P.brief.map(b => b[0] + ' – ' + b[1])); sec('Records to keep', P.after); sec('Attachments listed in the permit', P.att); sec('Documents to submit', P.docs);
    XL.save('SIMOPS_work_permit_10-18438.xlsx', [{name: 'Permit', rows: R, widths: [44, 110, 14], bold: [0]}]); };
  SO.route = function () { SO.view(); };
  try { const h = location.hash; if (!h || h === '#/' || /^#\/so/.test(h)) route(); } catch (e) {}
})();
