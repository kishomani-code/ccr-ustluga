// QC inspection checklists – E&I construction (RHI, Ust-Luga GPP)
// Check points follow the project method statements (Технологические карты):
//  MS 120.001 – earthing networks            GSP-(G0-Z00000X0)-CT-MC-120.001 rev 07
//  MS 120.006 – cable end / joint terminations 0.4 / 10 kV   CT-MC-120.006 rev 09
//  MS 120.007 – floodlight masts                CT-MC-120.007 rev 04
//  MS 120.008 – low-current / automation systems (JB, instruments, Ex)  CT-MC-120.008 rev 09
//  MS 120.009 – cable support system and cable laying   CT-MC-120.009 rev 06
// "DWG" = approved IFC drawings / cable schedule / vendor manual of the item.
// Each item: [EN, RU, reference]
window.QCL = {
 jb: {icon:'🧰', en:'Junction box / JP (JB, JP, JU)', ru:'Соединительная коробка / JP',
  sec:[
   ['Documents and receiving','Документы и входной контроль',[
    ['Tag number, type and size match the drawing and cable schedule','Номер (тег), тип и размер соответствуют чертежу и кабельному журналу','DWG'],
    ['Passport / certificate available (Ex certificate for hazardous area)','Есть паспорт / сертификат (сертификат Ex для взрывоопасной зоны)','MS 120.008'],
    ['No damage: enclosure, gasket, paint / coating, seals intact','Нет повреждений: корпус, уплотнение, покрытие, пломбы целы','MS 120.008'],
   ]],
   ['Explosion protection (if hazardous area)','Взрывозащита (если взрывоопасная зона)',[
    ['Ex marking on nameplate suits the zone, gas group and temperature class','Маркировка Ex соответствует зоне, группе и температурному классу','MS 120.008'],
    ['Warning labels and nameplate fitted and readable','Предупредительные надписи и табличка установлены и читаемы','MS 120.008'],
    ['Unused entries closed with certified (Ex) stopper plugs','Неиспользуемые вводы закрыты сертифицированными (Ex) заглушками','MS 120.008'],
    ['No unapproved modification (no extra holes, no missing screws)','Нет недопустимых изменений (лишних отверстий, отсутствующих винтов)','MS 120.008'],
   ]],
   ['Installation','Монтаж',[
    ['Location and height as per layout drawing','Место и высота установки по чертежу расположения','DWG'],
    ['Box / frame plumb and level, all fixings fitted and tight','Коробка / рама по уровню и отвесу, весь крепёж установлен и затянут','MS 120.008'],
    ['Frame / bracket cut ends deburred and zinc-repaired','Срезы рамы / кронштейна зачищены, цинк восстановлен','MS 120.009'],
    ['Access for maintenance; cover opens freely','Есть доступ для обслуживания; крышка открывается свободно','MS 120.008'],
    ['IP rating suits the location (fire-hazard zones min. IP43)','Степень защиты IP соответствует месту (пожароопасные зоны не ниже IP43)','MS 120.008'],
   ]],
   ['Cable entries','Кабельные вводы',[
    ['Gland type and size match cable (armoured / non-armoured)','Тип и размер ввода соответствуют кабелю (бронир. / небронир.)','DWG'],
    ['Glands tight, seal on outer sheath, armour clamped','Вводы затянуты, уплотнение по оболочке, броня зажата','MS 120.008'],
    ['Cable tag fitted at entry as per cable schedule','Бирка на кабеле у ввода по кабельному журналу','MS 120.008'],
    ['Cable supported before entry, no strain on gland','Кабель закреплён перед вводом, нет нагрузки на ввод','MS 120.009'],
   ]],
   ['Termination','Расключение',[
    ['Cores connected to terminals as per connection diagram','Жилы подключены к клеммам по схеме подключения','DWG'],
    ['Core ferrules marked as per connection diagram','Маркировка жил по схеме внешних соединений','MS 120.008'],
    ['Correct lugs / ferrules, crimped; no bare copper outside terminal','Правильные наконечники, опрессованы; нет оголённой меди вне клеммы','MS 120.008'],
    ['Spare core length left for re-termination','Оставлен запас жил для повторного подключения','MS 120.008'],
    ['Screen earthed at ONE end only (normally control-room side), other end insulated','Экран заземлён с ОДНОЙ стороны (обычно со стороны шкафа), другой конец изолирован','MS 120.008'],
    ['IS circuits: blue marking, IS and non-IS not in the same cable','Искробезопасные цепи: синяя маркировка, ИБ и не-ИБ не в одном кабеле','MS 120.008'],
    ['Spare cores insulated / terminated as per drawing','Резервные жилы изолированы / подключены по чертежу','DWG'],
    ['All terminal screws tight (pull test done)','Все клеммы затянуты (проверка подёргиванием)','MS 120.008'],
   ]],
   ['Earthing and final','Заземление и завершение',[
    ['External earth stud connected with correct conductor','Внешний зажим заземления подключён проводником нужного сечения','MS 120.008'],
    ['Internal PE / IS earth bar connected','Внутренняя шина PE / ИБ заземления подключена','DWG'],
    ['Inside clean, no debris; gasket in place; all cover screws fitted and tight','Внутри чисто; уплотнение на месте; все винты крышки установлены и затянуты','MS 120.008'],
    ['Tag plate fixed on the box','Табличка с тегом закреплена на коробке','DWG'],
   ]]]},
 cable: {icon:'🧵', en:'Cable pulling / laying', ru:'Прокладка кабеля',
  sec:[
   ['Before pulling','Перед прокладкой',[
    ['Cable tag, type and cross-section match cable schedule / tracker','Номер, марка и сечение кабеля по кабельному журналу / трекеру','DWG'],
    ['Drum number as allocated in the cable tracker','Номер барабана по распределению в трекере','Tracker'],
    ['Drum / cable without damage; insulation test before laying done','Барабан / кабель без повреждений; проверка изоляции до прокладки','MS 120.009'],
    ['Air temperature OK for laying this cable type','Температура воздуха допустима для прокладки этой марки','MS 120.009'],
   ]],
   ['Laying','Прокладка',[
    ['Route and tray level as per cable routing drawing','Трасса и полка лотка по чертежу трассы','DWG'],
    ['Power and control / instrument cables segregated; separator where required','Силовые и контрольные кабели разделены; перегородка где требуется','MS 120.009'],
    ['Bending radius not less than allowed (≥ 6 × cable diameter or vendor value)','Радиус изгиба не менее допустимого (≥ 6d или по заводу)','MS 120.009'],
    ['Laid "snake" with 1–2 % reserve; enough length for termination','Уложен «змейкой» с запасом 1–2 %; достаточный запас для подключения','MS 120.009'],
    ['Single layer, or bundles max 100 mm diameter','В один слой или пучками диаметром не более 100 мм','MS 120.009'],
    ['No damage, kinks or twisting after pulling','Нет повреждений, заломов, скручивания после протяжки','MS 120.009'],
   ]],
   ['Fixing and protection','Крепление и защита',[
    ['Vertical runs fixed every ≤ 1 m','Вертикальные участки закреплены через ≤ 1 м','MS 120.009'],
    ['Fixed at both sides of bends, ≤ 0.5 m from the bend','Закреплён с обеих сторон поворота, ≤ 0,5 м от поворота','MS 120.009'],
    ['Horizontal bundles banded every ≤ 4.5 m','Пучки на горизонтальных участках бандажированы через ≤ 4,5 м','MS 120.009'],
    ['Mechanical protection up to 2 m from floor where exposed','Механическая защита до 2 м от пола в доступных местах','MS 120.009'],
    ['Wall / floor penetrations sealed with non-combustible, fire-rated material','Проходы через стены / перекрытия заделаны негорючим огнестойким материалом','MS 120.009'],
    ['Cable ends sealed after pulling','Концы кабеля загерметизированы после прокладки','MS 120.009'],
   ]],
   ['Marking and tests','Маркировка и испытания',[
    ['Cable tags at both ends, at bends, branches and equipment','Бирки на обоих концах, на поворотах, ответвлениях и у оборудования','MS 120.009'],
    ['Insulation resistance measured and recorded (≥ 0.5 MΩ or project value)','Сопротивление изоляции измерено и записано (≥ 0,5 МОм или по проекту)','MS 120.008'],
    ['Pulled metres and date reported (tracker / IWP)','Проложенные метры и дата переданы (трекер / IWP)','Tracker'],
   ]]]},
 term: {icon:'🔌', en:'Cable termination / gland (both ends)', ru:'Разделка и подключение кабеля (оба конца)',
  sec:[
   ['Gland and entry','Кабельный ввод',[
    ['Gland type / size / Ex certificate match cable and equipment','Тип / размер / сертификат Ex ввода соответствуют кабелю и оборудованию','DWG'],
    ['Armour / braid clamped correctly in gland','Броня / оплётка правильно зажата во вводе','MS 120.008'],
    ['Gland tight; seal correct; shroud fitted if required','Ввод затянут; уплотнение правильное; колпачок установлен при необходимости','MS 120.008'],
   ]],
   ['Cores and connection','Жилы и подключение',[
    ['Sheath stripped neatly, no damage to core insulation','Оболочка разделана аккуратно, изоляция жил не повреждена','MS 120.006'],
    ['Correct lugs / ferrules crimped with the right tool','Правильные наконечники опрессованы правильным инструментом','MS 120.006'],
    ['Cores connected as per connection diagram (from / to terminals)','Жилы подключены по схеме (клеммы откуда / куда)','DWG'],
    ['Core marking (ferrules) as per diagram, readable','Маркировка жил по схеме, читаемая','MS 120.008'],
    ['Screen / drain wire treated as per drawing (one end earthed)','Экран / дренаж выполнен по чертежу (заземлён с одной стороны)','MS 120.008'],
    ['Spare cores insulated and marked','Резервные жилы изолированы и промаркированы','DWG'],
    ['Terminals tight; no strands outside terminal','Клеммы затянуты; нет жилок вне клеммы','MS 120.008'],
    ['Core bending radius OK (control cores ≥ 10 × core diameter)','Радиус изгиба жил допустим (контрольные ≥ 10 диаметров жилы)','MS 120.009'],
   ]],
   ['Power cable (0.4 / 10 kV)','Силовой кабель (0,4 / 10 кВ)',[
    ['Termination kit type as per project; installed per kit instruction','Концевая муфта по проекту; смонтирована по инструкции','MS 120.006'],
    ['Phase colours / sequence correct','Фазировка / расцветка правильная','MS 120.006'],
    ['Tests done and recorded (insulation / HV as required)','Испытания проведены и записаны (изоляция / ВН по требованию)','MS 120.006'],
   ]],
   ['Final','Завершение',[
    ['Cable tag at both ends','Бирка на обоих концах','MS 120.008'],
    ['Both ends terminated → cable can be reported closed','Оба конца подключены → кабель можно закрыть','Tracker'],
   ]]]},
 tray: {icon:'🛤️', en:'Cable tray / ladder', ru:'Кабельный лоток / лестница',
  sec:[
   ['Material','Материал',[
    ['Tray type and size as per drawing (perforated / solid / ladder)','Тип и размер лотка по чертежу (перфор. / сплошной / лестничный)','DWG'],
    ['No transport damage; zinc coating intact','Нет повреждений; цинковое покрытие целое','MS 120.009'],
   ]],
   ['Supports','Опоры',[
    ['Support spacing ≤ 3 m and as per vendor load table','Шаг опор ≤ 3 м и по таблице нагрузок завода','MS 120.009'],
    ['Supports / consoles level and plumb, fixings complete and tight','Опоры / консоли по уровню и отвесу, крепёж полный и затянут','MS 120.009'],
    ['Support type and length as per support drawing','Тип и длина опор по чертежу опор','DWG'],
   ]],
   ['Tray installation','Монтаж лотка',[
    ['Route and elevation as per layout drawing','Трасса и отметка по чертежу расположения','DWG'],
    ['Joints with standard connectors and bolts, all bolts fitted','Соединения стандартными соединителями и болтами, все болты стоят','MS 120.009'],
    ['Toothed earthing washers at joints (teeth to the coated surface)','Заземляющие царапающие шайбы на стыках','MS 120.009'],
    ['Bends / tees are standard fittings; radius suits the cables','Повороты / тройники заводские; радиус подходит для кабелей','MS 120.009'],
    ['Cut edges deburred and zinc-repaired','Срезы зачищены, цинк восстановлен','MS 120.009'],
    ['No water can collect in tray / box','Исключено скопление влаги в лотке / коробе','MS 120.008'],
    ['Separator installed where power and control share a tray','Перегородка установлена при совместной прокладке силовых и контрольных','MS 120.009'],
    ['Covers fitted where required, with cover holders','Крышки установлены где требуется, с держателями','DWG'],
   ]],
   ['Earthing','Заземление',[
    ['Tray run earthed at min. 2 points (ends) with steel strip ≥ 50 mm²','Трасса заземлена не менее чем в 2 точках (концы) полосой ≥ 50 мм²','MS 120.009'],
    ['Each branch earthed at its end','Каждое ответвление заземлено в конце','MS 120.009'],
    ['Continuous electrical path along the run','Непрерывная электрическая цепь по всей трассе','MS 120.009'],
   ]],
   ['Cables in tray','Кабели в лотке',[
    ['Fill not exceeded (closed box 35 %, box with lid 40 %); ~15 % spare','Заполнение не превышено (глухой 35 %, с крышкой 40 %); запас ~15 %','MS 120.009'],
    ['Bushes / protection where cables leave the tray','Защита (втулки) в местах выхода кабелей из лотка','MS 120.009'],
   ]]]},
 earth: {icon:'⏚', en:'Earthing / bonding', ru:'Заземление / уравнивание потенциалов',
  sec:[
   ['Earth grid (buried)','Контур заземления (в земле)',[
    ['Conductor size and material as per drawing','Сечение и материал проводника по чертежу','DWG'],
    ['Burial depth 0.5–0.7 m','Глубина прокладки 0,5–0,7 м','MS 120.001'],
    ['Electrodes as per drawing (number, length)','Электроды по чертежу (количество, длина)','DWG'],
    ['Hidden-works act signed before backfill','Акт скрытых работ подписан до засыпки','MS 120.001'],
   ]],
   ['Joints','Соединения',[
    ['Welded joint overlap: strip ≥ 2 × width, rod ≥ 6 × diameter','Сварной шов внахлёст: полоса ≥ 2 ширины, круг ≥ 6 диаметров','MS 120.001'],
    ['Welds checked by 1 kg hammer, no cracks','Сварка проверена молотком 1 кг, нет трещин','MS 120.001'],
    ['Welds coated with anti-corrosion paint, 50–100 mm each side','Швы окрашены антикоррозионным составом, 50–100 мм в обе стороны','MS 120.001'],
    ['Bolted joints clean, locked against loosening, accessible','Болтовые соединения зачищены, застопорены, доступны','MS 120.001'],
   ]],
   ['Equipment earthing','Заземление оборудования',[
    ['Each item connected to earth separately (not in series)','Каждое оборудование подключено отдельно (не последовательно)','DWG'],
    ['Earth conductor size, lug and colour as per drawing','Сечение, наконечник и цвет проводника по чертежу','DWG'],
    ['Steel conduits bonded with jumpers at fittings','Стальные трубы соединены перемычками на фитингах','MS 120.008'],
   ]],
   ['Test','Испытание',[
    ['Earth resistance measured and recorded (≤ value in drawing)','Сопротивление растеканию измерено и записано (≤ значения по проекту)','MS 120.001'],
    ['As-built scheme and test protocol attached','Исполнительная схема и протокол приложены','MS 120.001'],
   ]]]},
 mct: {icon:'🧱', en:'MCT / cable transit / wall penetration', ru:'MCT / кабельная проходка',
  sec:[
   ['Frame','Рама',[
    ['Frame type and size as per MCT drawing','Тип и размер рамы по чертежу MCT','DWG'],
    ['Frame fixed / welded to wall frame; sealed to the wall','Рама закреплена / приварена; уплотнена к стене','DWG'],
    ['Frame and modules of the SAME system (do not mix systems)','Рама и модули ОДНОЙ системы (системы не смешивать)','Vendor'],
   ]],
   ['Modules and sealing','Модули и уплотнение',[
    ['Module size matches each cable outer diameter (layers peeled correctly)','Размер модуля по диаметру каждого кабеля (слои сняты правильно)','Vendor'],
    ['All free openings filled with blank modules','Все свободные места заполнены глухими модулями','Vendor'],
    ['Lubricant applied as per vendor','Смазка нанесена по инструкции','Vendor'],
    ['Stay plates and compression unit fitted and tightened','Анкерные пластины и уплотнитель установлены и затянуты','Vendor'],
   ]],
   ['Final','Завершение',[
    ['Cables supported both sides, no strain on transit','Кабели закреплены с обеих сторон, нет нагрузки на проходку','MS 120.009'],
    ['Fire rating of penetration not lower than the wall','Огнестойкость проходки не ниже стены','MS 120.009'],
    ['Transit label / record of cables filled in','Табличка / запись кабелей в проходке заполнена','DWG'],
   ]]]},
 inst: {icon:'📟', en:'Field device / instrument / detector', ru:'Полевой прибор / извещатель',
  sec:[
   ['Item','Прибор',[
    ['Tag and model match datasheet / drawing','Тег и модель по опросному листу / чертежу','DWG'],
    ['Ex marking suits the zone (hazardous area)','Маркировка Ex соответствует зоне','MS 120.008'],
    ['No damage; seals and protective caps intact','Нет повреждений; пломбы и защитные колпачки целы','MS 120.008'],
   ]],
   ['Installation','Монтаж',[
    ['Location and height as per layout / hook-up','Место и высота по чертежу / схеме обвязки','DWG'],
    ['Orientation / direction as per vendor (e.g. detector facing)','Ориентация по инструкции (напр. направление извещателя)','Vendor'],
    ['Bracket / stand secure, plumb, fixings complete','Кронштейн / стойка надёжны, по отвесу, крепёж полный','MS 120.008'],
    ['Access for maintenance and testing','Есть доступ для обслуживания и проверки','MS 120.008'],
   ]],
   ['Connection','Подключение',[
    ['Gland / plug: correct type, tight, unused entry plugged','Ввод / заглушка: правильный тип, затянут, лишний ввод закрыт','MS 120.008'],
    ['Flexible conduit / hose supported, drip loop','Металлорукав закреплён, есть петля для стока','DWG'],
    ['Wired as per loop / connection diagram','Подключён по схеме','DWG'],
    ['Cable tag and tag plate fitted','Бирка кабеля и табличка установлены','MS 120.008'],
    ['Body earthed (external earth screw)','Корпус заземлён (внешний винт)','MS 120.008'],
   ]]]},
 light: {icon:'💡', en:'Lighting fixture / mast', ru:'Светильник / прожекторная мачта',
  sec:[
   ['Fixture','Светильник',[
    ['Type, power and Ex rating as per drawing','Тип, мощность и Ex по чертежу','DWG'],
    ['Mounting height and position as per layout','Высота и место по плану','DWG'],
    ['Bracket secure; glass / diffuser intact; lamp fitted','Кронштейн надёжен; стекло целое; лампа установлена','DWG'],
    ['Gland tight, unused entries plugged, earthed','Ввод затянут, лишние вводы закрыты, заземлён','MS 120.008'],
    ['Circuit / tag label fitted','Номер группы / тег нанесён','DWG'],
   ]],
   ['Mast / pole','Мачта / опора',[
    ['Foundation and anchor bolts as per drawing; nuts and locknuts tight','Фундамент и анкерные болты по чертежу; гайки и контргайки затянуты','MS 120.007'],
    ['Mast vertical (checked with level / plumb)','Мачта вертикальна (проверено уровнем / отвесом)','MS 120.007'],
    ['Mast earthed as per drawing','Мачта заземлена по чертежу','MS 120.007'],
    ['Floodlights aimed as per drawing','Прожекторы направлены по чертежу','MS 120.007'],
   ]]]},
 panel: {icon:'🗄️', en:'Panel / cabinet', ru:'Шкаф / панель',
  sec:[
   ['Installation','Установка',[
    ['Tag and type as per drawing; position as per layout','Тег и тип по чертежу; место по плану','DWG'],
    ['Level, fixed to base frame; all fixings fitted','По уровню, закреплён к основанию; весь крепёж стоит','MS 120.008'],
    ['No transport damage; doors open and close freely','Нет повреждений; двери открываются свободно','MS 120.008'],
   ]],
   ['Cables','Кабели',[
    ['Cable entries sealed; unused openings plugged','Кабельные вводы уплотнены; неиспользуемые отверстия закрыты','MS 120.008'],
    ['Cable tags and core marking as per diagram','Бирки и маркировка жил по схеме','MS 120.008'],
    ['Terminals tight (checked after connection)','Клеммы затянуты (проверено после подключения)','MS 120.008'],
    ['Screens earthed at panel side as per drawing','Экраны заземлены со стороны шкафа по чертежу','MS 120.008'],
   ]],
   ['Earthing and final','Заземление и завершение',[
    ['PE bus connected to earth grid','Шина PE подключена к контуру','DWG'],
    ['Inside clean, no debris, covers and shrouds fitted','Внутри чисто, крышки и защитные кожухи установлены','MS 120.008'],
    ['Nameplate / labels fitted','Табличка / надписи установлены','DWG'],
   ]]]},
 conduit: {icon:'🧪', en:'Conduit / flexible metal hose', ru:'Труба / металлорукав',
  sec:[
   ['Installation','Монтаж',[
    ['Type and size as per drawing','Тип и размер по чертежу','DWG'],
    ['Bending radius not less than cable allows','Радиус изгиба не менее допустимого для кабеля','MS 120.009'],
    ['Supported and clamped; no sagging','Закреплена; нет провисания','MS 120.009'],
    ['Fittings / connectors tight; end bushes fitted','Фитинги затянуты; концевые втулки установлены','MS 120.009'],
    ['Steel conduits bonded with jumpers at fittings','Стальные трубы соединены перемычками на фитингах','MS 120.008'],
    ['Conduit ends / gaps sealed after cable pulling','Концы труб и зазоры заделаны после протяжки','MS 120.009'],
   ]]]}
};
