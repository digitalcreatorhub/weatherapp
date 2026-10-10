// Тексты интерфейса: русский, латышский, английский. Только данные, без кода страницы
// (файл подключается и в странице, и в сервис-воркере).
const I18N = {
ru: {
  title:'Laiks: погода и лучшее время · Латвия', tagline:'погода · радар · Латвия', metaDesc:'Погода, радар осадков, облачность, море, пыльца, дороги и предупреждения для Латвии',
  loading:'загрузка…', install:'📲 Установить', searchPh:'Найти город или посёлок в Латвии…', searchAria:'Поиск населённого пункта',
  placesAria:'Места', langAria:'Язык', retry:'Повторить', loadingWeather:'Загружаю погоду…', loadingShort:'Загружаю…',
  todayTitle:'Сегодня коротко', tomorrowTitle:'Завтра коротко', h24Title:'Ближайшие 24 часа', warnTitle:'Предупреждения',
  notifOn:'🔔 Уведомления включены', notifOff:'🔔 Включить уведомления', test:'Проверить', checking:'Проверяю прогноз по всем местам…',
  cfgSummary:'⚙️ Настроить пороги', cfgReset:'Сбросить по умолчанию',
  mapTitle:'Погода в городах и облачность на 3 дня', layersAria:'Слой облачности',
  mapAria:'Карта Латвии: погода в городах и облачность по часам. Нажмите на город или точку, чтобы увидеть прогноз.',
  clear:'ясно', overcast:'сплошные облака', play:'Запустить анимацию', stop:'Остановить', sliderAria:'Время прогноза', nowBtn:'● Сейчас',
  mapNote:'Температура и значок у каждого места показывают прогноз на выбранный час. Красное кольцо с ⚠ означает опасную погоду в этот час. Линия показывает выбранный маршрут. Это прогноз модели, а не снимок со спутника.',
  radarTitle:'Радар осадков и дождь в ближайшие часы', computing:'Считаю…', radarAria:'Радар осадков над Латвией за последние 2 часа',
  radarPlay:'Запустить радар', radarFrame:'Кадр радара', last2h:'последние 2 часа', weaker:'слабее', stronger:'сильнее', radarSrc:'Радар: RainViewer',
  roadTitle:'Погода на дороге', roadFrom:'Откуда', roadTo:'Куда', roadDepart:'Выезд',
  dailyTitle:'Прогноз на 5 дней', dailyHint:'· точка справа: насколько согласны модели ECMWF, ICON и GFS',
  seaTitle:'Море и волны', pollenTitle:'Пыльца', moonLoading:'Считаю фазу Луны…', accLoading:'Учёт точности…',
  hourlyTitle:'Температура и осадки по часам', hourlyAria:'График температуры по часам на 5 дней',
  footer:'Данные: {om} (прогноз, модели ECMWF, DWD ICON, NOAA GFS, море, воздух и пыльца CAMS), радар {rv}, официальные предупреждения {ma} (LVĢMC). Всё бесплатно и без ключей. Фаза Луны считается на устройстве.',

  netErr:'Не удалось связаться с Open-Meteo. Проверьте интернет. Если страница открыта внутри другого приложения, откройте её в Chrome.',
  noData:'Нет данных о погоде.', favAdd:'Добавить в избранное', favRemove:'Убрать из избранного',
  feels:'Ощущается как {f}. Сегодня от {lo} до {hi}', wind:'Ветер', humidity:'Влажность', clouds:'Облачность', pressure:'Давление',
  uvToday:'УФ-индекс (сегодня до {n})', air:'Воздух (EAQI)', sun:'Восход и закат', sunVal:'{a} и {b}', daylen:'Световой день', daylenVal:'{h} ч {m} мин',
  ms:'м/с', hpa:'гПа', mm:'мм', km:'км', mmh:'мм/ч',
  today:'Сегодня', tomorrow:'Завтра', todayL:'сегодня', tomorrowL:'завтра', nowLbl:'Сейчас',
  uv:['низкий','умеренный','высокий','очень высокий','экстремальный'],
  aqi:['хороший','приемлемый','умеренный','плохой','очень плохой','опасный'],
  dirs:['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'],
  conf:['высокая','средняя','низкая'], confTitle:'Уверенность прогноза: {l}. Модели расходятся на {s}°',
  accTitle:'Какой модели верить',
  accPick:'Выберите город из списка или добавьте место в избранное, и приложение начнёт вести учёт точности.',
  accWait:'Накапливаю данные для «{p}»: собрано дней {t}, сверено {d}. Нужно хотя бы 2. Приложение сохраняет прогноз на завтра и сравнивает его с фактом на следующий день. Откройте его завтра.',
  accMean:'Среднее трёх моделей', accAuto:'Open-Meteo (авто)',
  accNote:'Средняя ошибка максимальной температуры при прогнозе на 1 день вперёд, дней в сравнении: {d}. «Факт» берётся из анализа модели, а не с метеостанции. Меньше значит точнее.',
  moonTitle:'Луна и звёздное небо',
  moonNames:['Новолуние','Растущий серп','Первая четверть','Растущая Луна','Полнолуние','Убывающая Луна','Последняя четверть','Убывающий серп'],
  moonLit:'Освещена на {p}%, возраст {a} дн.', newMoon:'🌑 Новолуние: {d}', fullMoon:'🌕 Полнолуние: {d}',
  sky:['Отличная видимость звёзд','Хорошая видимость звёзд','Облачно с прояснениями, звёзды местами','Звёзд почти не будет'],
  skyNote:'Ночью облачность в среднем {c}%.', skyMoon:'Яркая Луна подсветит небо, слабые звёзды будут хуже видны.',
  countries:{ee:'ЭСТОНИЯ', lt:'ЛИТВА', by:'БЕЛАРУСЬ', ru:'РОССИЯ'}, pointName:'Точка {a}, {b}',
  phase:['☀️ день','🌅 сумерки','🌙 ночь'], meanClouds:'облачность в среднем {c}%, ', moonShort:'Луна {e} {p}%',
  layers:['Всего','Низкие','Средние','Высокие'],
  radarNA:'Радар сейчас недоступен', agoMin:', {n} мин назад', justNow:', сейчас', radarLoading:'Загружаю радар…',
  ncNA:'Минутный прогноз осадков для этого места недоступен.', ncDry:'✅ Без осадков в ближайшие 3 часа',
  ncStart:'☔ Осадки начнутся через ~{m} мин, до {v} мм за 15 мин', ncAll:'🌧️ Идут осадки, ближайшие 3 часа не закончатся', ncEnd:'🌧️ Идут осадки, закончатся через ~{m} мин',
  wtypes:{storm:'Гроза', rain:'Сильный дождь', snow:'Сильный снег', ice:'Ледяной дождь, гололёд', wind:'Сильный ветер', heat:'Сильная жара', frost:'Сильный мороз', freeze:'Заморозок'},
  gusts:'порывы до {v} м/с', upHot:'до {v}', downCold:'до {v}', upToMm:'до {v} мм/ч', ongoing:'уже идёт, до {t}',
  noDanger:'✅ В ближайшие {h} часов опасной погоды не ожидается (мест под наблюдением: {n}).',
  cfgStorm:'Гроза', cfgRain:'Сильный дождь от', cfgSnow:'Сильный снег', cfgIce:'Ледяной дождь', cfgWind:'Порывы ветра от', cfgHeat:'Жара от',
  cfgFrost:'Мороз до', cfgFreeze:'Заморозок до (для сада)', cfgOfficial:'Официальные предупреждения LVĢMC', cfgLook:'Смотреть вперёд', hours:'часов',
  close:'Закрыть', hourTip:'{d} {h}: {t}, осадки {p}%',
  favFull:'Избранное заполнено', favFullTxt:'Можно сохранить до 8 мест. Уберите одно, нажав ★.', favNamePrompt:'Название места', favDefault:'Моя точка',
  notFound:'Ничего не найдено', offline:'нет связи, повторяю', dataAt:'данные на {t}, проверка через {s} с',

  nUnsupported:'этот браузер не поддерживает уведомления (откройте в Chrome, не во встроенном браузере Telegram, Instagram и т. п.)',
  nDenied:'уведомления запрещены для этого сайта', nNotYet:'разрешение ещё не выдано',
  nNoSW:'служебный файл sw.js не запустился (проверьте, что он загружен рядом с index.html)',
  nNeedHttps:'нужен https-адрес (GitHub Pages), из файла уведомления не работают',
  nRejected:'Android не принял уведомление: {e}', nRegFail:'служебный файл sw.js не зарегистрировался: {e}',
  bgNo:'Фоновая проверка при закрытом приложении в этом браузере не поддерживается.',
  bgInstall:'Для предупреждений при закрытом приложении установите его: меню ⋮ в Chrome, «Установить приложение», и открывайте с значка.',
  bgOn:'Фоновая проверка включена: Chrome запускает её сам, обычно раз в несколько часов.',
  howBrowser:'Chrome: нажмите значок замка или настроек слева от адреса → «Разрешения» → «Уведомления» → «Разрешить». Или ⋮ → Настройки → Настройки сайтов → Уведомления.',
  howApp:'Долго нажмите на значок Laiks на экране телефона → «О приложении» (ⓘ) → «Уведомления» → включите.',
  howOS:'Проверьте также Настройки Android → Приложения → Chrome (или Laiks) → Уведомления: они должны быть включены, а режим «Не беспокоить» выключен.',
  stUnsupported:'Системные уведомления здесь недоступны. Откройте адрес приложения в Chrome. Всплывающие окна на странице и вибрация работают.',
  stGranted:'Разрешение на уведомления выдано. Нажмите «Проверить»: должно прийти уведомление в шторку Android.',
  stDenied:'Уведомления запрещены. ', stDefault:'Нажмите «Включить уведомления» и выберите «Разрешить».',
  stHttps:'Нужен https-адрес (GitHub Pages): из локального файла системные уведомления не работают.', stLastErr:'Последняя ошибка: {e}.',
  diag:'Диагностика: разрешение {p}, служебный файл {s}, режим {m}.',
  diagP:{granted:'есть', denied:'запрещено', default:'не выдано', unsupported:'нет API'},
  diagSWok:'работает', diagSWno:'не запущен', modeApp:'установленное приложение', modeBrowser:'браузер',
  quietTitle:'Chrome скрыл запрос', quietTxt:'Нажмите на значок 🔔 или замка в адресной строке и разрешите уведомления. ',
  deniedTitle:'Уведомления запрещены', testTitle:'Проверка предупреждений', testBody:'Так будет выглядеть предупреждение о плохой погоде.',
  sentTitle:'Уведомление отправлено', sentBody:'Посмотрите в шторку Android. Если его там нет: ', notSentTitle:'Уведомление не отправлено',

  offTitle:'Официальные предупреждения (LVĢMC)', offNone:'✅ Сейчас официальных предупреждений по Латвии нет.',
  offFail:'Официальные предупреждения не загрузились. Смотрите их на сайте {lv} или {ma}.', offLoading:'Загружаю официальные предупреждения…',
  levels:{yellow:'Жёлтый уровень', orange:'Оранжевый уровень', red:'Красный уровень'},
  offAreas:'Районы: {a}', offHere:'📍 касается выбранного места', offFrom:'{a} – {b}', offMore:'Подробнее',
  modelTitle:'По прогнозу модели (ближайшие {h} ч)', offSource:'Источник: LVĢMC через MeteoAlarm',
  mtypes:{1:'Ветер',2:'Снег и гололёд',3:'Гроза',4:'Туман',5:'Жара',6:'Холод',7:'Прибрежные явления',8:'Лесные пожары',9:'Лавины',10:'Дождь',12:'Наводнение',13:'Дождь и паводок'},

  todayRange:'От {lo} до {hi}, ощущается от {flo} до {fhi}.',
  wear:['Зимний пуховик, шапка, шарф, варежки, термобельё','Зимняя куртка, шапка и перчатки','Тёплая куртка, шапка, перчатки','Демисезонная куртка или пальто','Лёгкая куртка или свитер','Кофта или рубашка, вечером лёгкая куртка','Футболка и лёгкая одежда'],
  umbrellaYes:'Возьмите зонт: дождь вероятен с {t}', umbrellaMaybe:'Зонт на всякий случай: вероятность осадков до {p}%', umbrellaNo:'Зонт не нужен',
  snowShoes:'Снег: непромокаемая обувь с хорошей подошвой', windy:'Ветрено, порывы до {g} м/с: капюшон лучше зонта',
  sunscreen:'УФ до {u}: солнцезащитный крем и очки', iceRisk:'Возможна гололедица: осторожно на тротуарах и дорогах',

  seaWater:'Вода', seaWave:'Волна', seaMax:'макс. за сутки {v} м', seaPeriod:'период {s} с', seaState:['спокойно','умеренно','неспокойно','шторм'],
  seaNA:'Нет данных', seaNote:'Данные моделей Open-Meteo Marine (DWD, Météo-France). Для навигации не подходят.',
  pollenTypes:{alder:'Ольха', birch:'Берёза', grass:'Злаки (трава)', mugwort:'Полынь', ragweed:'Амброзия'},
  pollenLevels:['нет','низкий','средний','высокий','очень высокий'],
  pollenOff:'Сейчас не сезон цветения: данных о пыльце нет. Европейская служба CAMS публикует их весной и летом.',
  pollenNote:'Максимум на сегодня, зёрен в м³. Уровни примерные.', pollenNA:'Данные о пыльце не загрузились.',

  roadNowOpt:'сейчас', roadIn:'через {h} ч', roadSummary:'{a} → {b}: ~{km} км, ~{dur}. Выезд {t1}, прибытие ~{t2}.', dur:'{h} ч {m} мин',
  roadStraight:'Маршрут по прямой, примерно.', roadOK:'✅ На маршруте опасных условий не ожидается',
  roadWarn:'⚠️ Будьте осторожны: {r}', roadDanger:'⛔ Опасно: {r}',
  rIce:'гололёд', rIceRisk:'возможна гололедица', rFrost:'иней на дороге', rSnow:'снег', rSnowHeavy:'сильный снегопад',
  rFog:'туман, видимость {v}', rRain:'сильный дождь', rWind:'порывы до {g} м/с', rFreezeRain:'ледяной дождь',
  roadAir:'воздух', roadSurf:'дорога', roadVis:'видимость', roadOkShort:'нормально',
  roadNote:'Температура поверхности и видимость — оценка модели Open-Meteo, а не данные дорожных датчиков. Скорость принята около 75 км/ч. Официальная информация о дорогах: {lvc}.',
  roadSame:'Выберите разные пункты', roadLoading:'Считаю маршрут…', roadFail:'Не удалось получить прогноз для маршрута.', visKm:'{v} км', visM:'{v} м',

  wmo:{0:'Ясно',1:'Малооблачно',2:'Переменная облачность',3:'Пасмурно',45:'Туман',48:'Изморозь',51:'Лёгкая морось',53:'Морось',55:'Сильная морось',
    56:'Ледяная морось',57:'Ледяная морось',61:'Небольшой дождь',63:'Дождь',65:'Сильный дождь',66:'Ледяной дождь',67:'Ледяной дождь',71:'Небольшой снег',
    73:'Снег',75:'Сильный снег',77:'Снежные зёрна',80:'Ливень',81:'Сильный ливень',82:'Очень сильный ливень',85:'Снегопад',86:'Сильный снегопад',
    95:'Гроза',96:'Гроза с градом',99:'Гроза с градом'}
},

lv: {
  title:'Laiks: laikapstākļi un labākais laiks · Latvija', tagline:'laiks · radars · Latvija', metaDesc:'Laikapstākļi, nokrišņu radars, mākoņainība, jūra, ziedputekšņi, ceļi un brīdinājumi Latvijā',
  loading:'ielāde…', install:'📲 Instalēt', searchPh:'Meklēt pilsētu vai ciemu Latvijā…', searchAria:'Vietas meklēšana',
  placesAria:'Vietas', langAria:'Valoda', retry:'Mēģināt vēlreiz', loadingWeather:'Ielādēju laikapstākļus…', loadingShort:'Ielādēju…',
  todayTitle:'Šodien īsumā', tomorrowTitle:'Rīt īsumā', h24Title:'Tuvākās 24 stundas', warnTitle:'Brīdinājumi',
  notifOn:'🔔 Paziņojumi ieslēgti', notifOff:'🔔 Ieslēgt paziņojumus', test:'Pārbaudīt', checking:'Pārbaudu prognozi visām vietām…',
  cfgSummary:'⚙️ Iestatīt sliekšņus', cfgReset:'Atjaunot noklusējumu',
  mapTitle:'Laiks pilsētās un mākoņainība 3 dienām', layersAria:'Mākoņu slānis',
  mapAria:'Latvijas karte: laiks pilsētās un mākoņainība pa stundām. Pieskarieties pilsētai vai punktam, lai redzētu prognozi.',
  clear:'skaidrs', overcast:'apmācies', play:'Sākt animāciju', stop:'Apturēt', sliderAria:'Prognozes laiks', nowBtn:'● Tagad',
  mapNote:'Temperatūra un ikona pie katras vietas rāda prognozi izvēlētajai stundai. Sarkans aplis ar ⚠ nozīmē bīstamus laikapstākļus šajā stundā. Līnija rāda izvēlēto maršrutu. Tā ir modeļa prognoze, nevis satelīta attēls.',
  radarTitle:'Nokrišņu radars un lietus tuvākajās stundās', computing:'Aprēķinu…', radarAria:'Nokrišņu radars virs Latvijas pēdējās 2 stundās',
  radarPlay:'Palaist radaru', radarFrame:'Radara kadrs', last2h:'pēdējās 2 stundas', weaker:'vājāki', stronger:'stiprāki', radarSrc:'Radars: RainViewer',
  roadTitle:'Laikapstākļi uz ceļa', roadFrom:'No', roadTo:'Uz', roadDepart:'Izbraukšana',
  dailyTitle:'Prognoze 5 dienām', dailyHint:'· punkts labajā pusē: cik vienisprātis ir modeļi ECMWF, ICON un GFS',
  seaTitle:'Jūra un viļņi', pollenTitle:'Ziedputekšņi', moonLoading:'Aprēķinu Mēness fāzi…', accLoading:'Precizitātes uzskaite…',
  hourlyTitle:'Temperatūra un nokrišņi pa stundām', hourlyAria:'Temperatūras grafiks pa stundām 5 dienām',
  footer:'Dati: {om} (prognoze, modeļi ECMWF, DWD ICON, NOAA GFS, jūra, gaisa kvalitāte un ziedputekšņi CAMS), radars {rv}, oficiālie brīdinājumi {ma} (LVĢMC). Viss bez maksas un bez atslēgām. Mēness fāze tiek aprēķināta ierīcē.',

  netErr:'Neizdevās sazināties ar Open-Meteo. Pārbaudiet internetu. Ja lapa atvērta citā lietotnē, atveriet to pārlūkā Chrome.',
  noData:'Nav laikapstākļu datu.', favAdd:'Pievienot izlasei', favRemove:'Noņemt no izlases',
  feels:'Sajūtu temperatūra {f}. Šodien no {lo} līdz {hi}', wind:'Vējš', humidity:'Mitrums', clouds:'Mākoņainība', pressure:'Spiediens',
  uvToday:'UV indekss (šodien līdz {n})', air:'Gaiss (EAQI)', sun:'Saullēkts un saulriets', sunVal:'{a} un {b}', daylen:'Dienas garums', daylenVal:'{h} st {m} min',
  ms:'m/s', hpa:'hPa', mm:'mm', km:'km', mmh:'mm/h',
  today:'Šodien', tomorrow:'Rīt', todayL:'šodien', tomorrowL:'rīt', nowLbl:'Tagad',
  uv:['zems','mērens','augsts','ļoti augsts','ekstrēms'],
  aqi:['labs','pieņemams','mērens','slikts','ļoti slikts','bīstams'],
  dirs:['Z','ZA','A','DA','D','DR','R','ZR'],
  conf:['augsta','vidēja','zema'], confTitle:'Prognozes ticamība: {l}. Modeļu atšķirība {s}°',
  accTitle:'Kuram modelim ticēt',
  accPick:'Izvēlieties pilsētu no saraksta vai pievienojiet vietu izlasei, un lietotne sāks uzskaitīt precizitāti.',
  accWait:'Krāju datus vietai «{p}»: savāktas dienas {t}, salīdzinātas {d}. Vajag vismaz 2. Lietotne saglabā rītdienas prognozi un nākamajā dienā salīdzina to ar faktu. Atveriet to rīt.',
  accMean:'Trīs modeļu vidējais', accAuto:'Open-Meteo (auto)',
  accNote:'Maksimālās temperatūras vidējā kļūda prognozei 1 dienu uz priekšu, salīdzinātas dienas: {d}. «Fakts» ņemts no modeļa analīzes, nevis no meteostacijas. Mazāks nozīmē precīzāks.',
  moonTitle:'Mēness un zvaigžņotās debesis',
  moonNames:['Jauns mēness','Augošs sirpis','Pirmais ceturksnis','Augošs Mēness','Pilnmēness','Dilstošs Mēness','Pēdējais ceturksnis','Dilstošs sirpis'],
  moonLit:'Apgaismots {p}%, vecums {a} d.', newMoon:'🌑 Jauns mēness: {d}', fullMoon:'🌕 Pilnmēness: {d}',
  sky:['Lieliska zvaigžņu redzamība','Laba zvaigžņu redzamība','Mākoņains ar skaidrībām, zvaigznes vietām','Zvaigznes gandrīz nebūs redzamas'],
  skyNote:'Naktī mākoņainība vidēji {c}%.', skyMoon:'Spožs Mēness izgaismos debesis, vājās zvaigznes būs grūtāk saskatīt.',
  countries:{ee:'IGAUNIJA', lt:'LIETUVA', by:'BALTKRIEVIJA', ru:'KRIEVIJA'}, pointName:'Punkts {a}, {b}',
  phase:['☀️ diena','🌅 krēsla','🌙 nakts'], meanClouds:'mākoņainība vidēji {c}%, ', moonShort:'Mēness {e} {p}%',
  layers:['Kopā','Zemie','Vidējie','Augstie'],
  radarNA:'Radars pašlaik nav pieejams', agoMin:', pirms {n} min', justNow:', tagad', radarLoading:'Ielādēju radaru…',
  ncNA:'Minūšu nokrišņu prognoze šai vietai nav pieejama.', ncDry:'✅ Bez nokrišņiem tuvākās 3 stundas',
  ncStart:'☔ Nokrišņi sāksies pēc ~{m} min, līdz {v} mm 15 minūtēs', ncAll:'🌧️ Nokrišņi jau ir, tuvākajās 3 stundās nebeigsies', ncEnd:'🌧️ Nokrišņi jau ir, beigsies pēc ~{m} min',
  wtypes:{storm:'Pērkona negaiss', rain:'Stiprs lietus', snow:'Stiprs sniegs', ice:'Ledus lietus, apledojums', wind:'Stiprs vējš', heat:'Liels karstums', frost:'Stiprs sals', freeze:'Salna'},
  gusts:'brāzmas līdz {v} m/s', upHot:'līdz {v}', downCold:'līdz {v}', upToMm:'līdz {v} mm/h', ongoing:'jau notiek, līdz {t}',
  noDanger:'✅ Tuvāko {h} stundu laikā bīstami laikapstākļi nav gaidāmi (uzraudzītās vietas: {n}).',
  cfgStorm:'Pērkona negaiss', cfgRain:'Stiprs lietus no', cfgSnow:'Stiprs sniegs', cfgIce:'Ledus lietus', cfgWind:'Vēja brāzmas no', cfgHeat:'Karstums no',
  cfgFrost:'Sals līdz', cfgFreeze:'Salna līdz (dārzam)', cfgOfficial:'Oficiālie LVĢMC brīdinājumi', cfgLook:'Skatīties uz priekšu', hours:'stundas',
  close:'Aizvērt', hourTip:'{d} {h}: {t}, nokrišņi {p}%',
  favFull:'Izlase ir pilna', favFullTxt:'Var saglabāt līdz 8 vietām. Noņemiet vienu, nospiežot ★.', favNamePrompt:'Vietas nosaukums', favDefault:'Mana vieta',
  notFound:'Nekas nav atrasts', offline:'nav savienojuma, mēģinu vēlreiz', dataAt:'dati uz {t}, pārbaude pēc {s} s',

  nUnsupported:'šī pārlūkprogramma neatbalsta paziņojumus (atveriet Chrome, nevis Telegram, Instagram u. tml. iebūvētajā pārlūkā)',
  nDenied:'paziņojumi šai vietnei ir aizliegti', nNotYet:'atļauja vēl nav dota',
  nNoSW:'palīgfails sw.js nepalaidās (pārbaudiet, vai tas ir augšupielādēts blakus index.html)',
  nNeedHttps:'nepieciešama https adrese (GitHub Pages), no faila paziņojumi nedarbojas',
  nRejected:'Android nepieņēma paziņojumu: {e}', nRegFail:'palīgfailu sw.js neizdevās reģistrēt: {e}',
  bgNo:'Fona pārbaude ar aizvērtu lietotni šajā pārlūkā netiek atbalstīta.',
  bgInstall:'Lai saņemtu brīdinājumus ar aizvērtu lietotni, instalējiet to: Chrome izvēlne ⋮, «Instalēt lietotni», un atveriet to no ikonas.',
  bgOn:'Fona pārbaude ieslēgta: Chrome to palaiž pats, parasti reizi dažās stundās.',
  howBrowser:'Chrome: pieskarieties slēdzenes vai iestatījumu ikonai pa kreisi no adreses → «Atļaujas» → «Paziņojumi» → «Atļaut». Vai ⋮ → Iestatījumi → Vietņu iestatījumi → Paziņojumi.',
  howApp:'Turiet nospiestu Laiks ikonu tālruņa ekrānā → «Informācija par lietotni» (ⓘ) → «Paziņojumi» → ieslēdziet.',
  howOS:'Pārbaudiet arī Android Iestatījumi → Lietotnes → Chrome (vai Laiks) → Paziņojumi: tiem jābūt ieslēgtiem, bet režīmam «Netraucēt» izslēgtam.',
  stUnsupported:'Sistēmas paziņojumi šeit nav pieejami. Atveriet lietotnes adresi pārlūkā Chrome. Uznirstošie logi lapā un vibrācija darbojas.',
  stGranted:'Atļauja paziņojumiem dota. Nospiediet «Pārbaudīt»: Android paziņojumu joslā jāparādās paziņojumam.',
  stDenied:'Paziņojumi ir aizliegti. ', stDefault:'Nospiediet «Ieslēgt paziņojumus» un izvēlieties «Atļaut».',
  stHttps:'Nepieciešama https adrese (GitHub Pages): no lokāla faila sistēmas paziņojumi nedarbojas.', stLastErr:'Pēdējā kļūda: {e}.',
  diag:'Diagnostika: atļauja {p}, palīgfails {s}, režīms {m}.',
  diagP:{granted:'ir', denied:'aizliegta', default:'nav dota', unsupported:'nav API'},
  diagSWok:'darbojas', diagSWno:'nav palaists', modeApp:'instalēta lietotne', modeBrowser:'pārlūks',
  quietTitle:'Chrome paslēpa pieprasījumu', quietTxt:'Pieskarieties 🔔 vai slēdzenes ikonai adreses joslā un atļaujiet paziņojumus. ',
  deniedTitle:'Paziņojumi aizliegti', testTitle:'Brīdinājumu pārbaude', testBody:'Šādi izskatīsies brīdinājums par sliktiem laikapstākļiem.',
  sentTitle:'Paziņojums nosūtīts', sentBody:'Paskatieties Android paziņojumu joslā. Ja tā tur nav: ', notSentTitle:'Paziņojums nav nosūtīts',

  offTitle:'Oficiālie brīdinājumi (LVĢMC)', offNone:'✅ Pašlaik Latvijā oficiālu brīdinājumu nav.',
  offFail:'Oficiālos brīdinājumus neizdevās ielādēt. Skatiet tos vietnē {lv} vai {ma}.', offLoading:'Ielādēju oficiālos brīdinājumus…',
  levels:{yellow:'Dzeltenais līmenis', orange:'Oranžais līmenis', red:'Sarkanais līmenis'},
  offAreas:'Teritorijas: {a}', offHere:'📍 attiecas uz izvēlēto vietu', offFrom:'{a} – {b}', offMore:'Sīkāk',
  modelTitle:'Pēc modeļa prognozes (tuvākās {h} st)', offSource:'Avots: LVĢMC caur MeteoAlarm',
  mtypes:{1:'Vējš',2:'Sniegs un apledojums',3:'Pērkona negaiss',4:'Migla',5:'Karstums',6:'Aukstums',7:'Piekrastes parādības',8:'Meža ugunsgrēki',9:'Lavīnas',10:'Lietus',12:'Plūdi',13:'Lietus un plūdi'},

  todayRange:'No {lo} līdz {hi}, sajūtu temperatūra no {flo} līdz {fhi}.',
  wear:['Ziemas dūnu jaka, cepure, šalle, dūraiņi, termoveļa','Ziemas jaka, cepure un cimdi','Silta jaka, cepure, cimdi','Pavasara vai rudens jaka, mētelis','Viegla jaka vai džemperis','Jaka vai krekls, vakarā viegla jaciņa','T-krekls un viegls apģērbs'],
  umbrellaYes:'Paņemiet lietussargu: lietus iespējams no {t}', umbrellaMaybe:'Lietussargs katram gadījumam: nokrišņu varbūtība līdz {p}%', umbrellaNo:'Lietussargs nav vajadzīgs',
  snowShoes:'Sniegs: ūdensnecaurlaidīgi apavi ar labu zoli', windy:'Vējains, brāzmas līdz {g} m/s: kapuce būs labāka par lietussargu',
  sunscreen:'UV līdz {u}: saules krēms un brilles', iceRisk:'Iespējams slidens: uzmanīgi uz ietvēm un ceļiem',

  seaWater:'Ūdens', seaWave:'Viļņi', seaMax:'maks. diennaktī {v} m', seaPeriod:'periods {s} s', seaState:['mierīgs','mērens','nemierīgs','vētra'],
  seaNA:'Nav datu', seaNote:'Open-Meteo Marine modeļu dati (DWD, Météo-France). Navigācijai nav piemēroti.',
  pollenTypes:{alder:'Alksnis', birch:'Bērzs', grass:'Graudzāles', mugwort:'Vībotne', ragweed:'Ambrozija'},
  pollenLevels:['nav','zems','vidējs','augsts','ļoti augsts'],
  pollenOff:'Pašlaik nav ziedēšanas sezona: datu par ziedputekšņiem nav. Eiropas dienests CAMS tos publicē pavasarī un vasarā.',
  pollenNote:'Šodienas maksimums, graudi m³. Līmeņi aptuveni.', pollenNA:'Ziedputekšņu dati netika ielādēti.',

  roadNowOpt:'tagad', roadIn:'pēc {h} st', roadSummary:'{a} → {b}: ~{km} km, ~{dur}. Izbraukšana {t1}, ierašanās ~{t2}.', dur:'{h} st {m} min',
  roadStraight:'Maršruts pa taisni, aptuveni.', roadOK:'✅ Maršrutā bīstami apstākļi nav gaidāmi',
  roadWarn:'⚠️ Esiet uzmanīgi: {r}', roadDanger:'⛔ Bīstami: {r}',
  rIce:'apledojums', rIceRisk:'iespējams slidens', rFrost:'sarma uz ceļa', rSnow:'sniegs', rSnowHeavy:'stiprs sniegs',
  rFog:'migla, redzamība {v}', rRain:'stiprs lietus', rWind:'brāzmas līdz {g} m/s', rFreezeRain:'ledus lietus',
  roadAir:'gaiss', roadSurf:'ceļš', roadVis:'redzamība', roadOkShort:'normāli',
  roadNote:'Virsmas temperatūra un redzamība ir Open-Meteo modeļa novērtējums, nevis ceļu sensoru dati. Pieņemtais ātrums ap 75 km/h. Oficiālā informācija par ceļiem: {lvc}.',
  roadSame:'Izvēlieties dažādas vietas', roadLoading:'Aprēķinu maršrutu…', roadFail:'Neizdevās iegūt maršruta prognozi.', visKm:'{v} km', visM:'{v} m',

  wmo:{0:'Skaidrs',1:'Gandrīz skaidrs',2:'Mainīgs mākoņu daudzums',3:'Apmācies',45:'Migla',48:'Sarmas migla',51:'Neliela smidzināšana',53:'Smidzina',55:'Stipra smidzināšana',
    56:'Ledus smidzināšana',57:'Ledus smidzināšana',61:'Neliels lietus',63:'Lietus',65:'Stiprs lietus',66:'Ledus lietus',67:'Ledus lietus',71:'Neliels sniegs',
    73:'Sniegs',75:'Stiprs sniegs',77:'Sniega graudi',80:'Lietusgāze',81:'Stipra lietusgāze',82:'Ļoti stipra lietusgāze',85:'Sniegputenis',86:'Stiprs sniegputenis',
    95:'Pērkona negaiss',96:'Pērkona negaiss ar krusu',99:'Pērkona negaiss ar krusu'}
},

en: {
  title:'Laiks: Latvia weather and the best time for everything', tagline:'weather · radar · Latvia', metaDesc:'Weather, precipitation radar, cloud cover, sea, pollen, roads and warnings for Latvia',
  loading:'loading…', install:'📲 Install', searchPh:'Find a town or village in Latvia…', searchAria:'Search for a place',
  placesAria:'Places', langAria:'Language', retry:'Retry', loadingWeather:'Loading weather…', loadingShort:'Loading…',
  todayTitle:'Today at a glance', tomorrowTitle:'Tomorrow at a glance', h24Title:'Next 24 hours', warnTitle:'Warnings',
  notifOn:'🔔 Notifications on', notifOff:'🔔 Enable notifications', test:'Test', checking:'Checking the forecast for all places…',
  cfgSummary:'⚙️ Set thresholds', cfgReset:'Reset to defaults',
  mapTitle:'City weather and cloud cover for 3 days', layersAria:'Cloud layer',
  mapAria:'Map of Latvia: city weather and hourly cloud cover. Tap a city or point to see its forecast.',
  clear:'clear', overcast:'overcast', play:'Play animation', stop:'Stop', sliderAria:'Forecast time', nowBtn:'● Now',
  mapNote:'The temperature and icon next to each place show the forecast for the selected hour. A red ring with ⚠ means dangerous weather at that hour. The line shows the selected route. This is a model forecast, not a satellite image.',
  radarTitle:'Precipitation radar and rain in the next hours', computing:'Calculating…', radarAria:'Precipitation radar over Latvia for the last 2 hours',
  radarPlay:'Play radar', radarFrame:'Radar frame', last2h:'last 2 hours', weaker:'lighter', stronger:'heavier', radarSrc:'Radar: RainViewer',
  roadTitle:'Road weather', roadFrom:'From', roadTo:'To', roadDepart:'Departure',
  dailyTitle:'5-day forecast', dailyHint:'· dot on the right: how closely the ECMWF, ICON and GFS models agree',
  seaTitle:'Sea and waves', pollenTitle:'Pollen', moonLoading:'Calculating the Moon phase…', accLoading:'Accuracy tracking…',
  hourlyTitle:'Hourly temperature and precipitation', hourlyAria:'Hourly temperature chart for 5 days',
  footer:'Data: {om} (forecast, ECMWF, DWD ICON and NOAA GFS models, sea, CAMS air quality and pollen), radar {rv}, official warnings {ma} (LVĢMC). All free and keyless. The Moon phase is calculated on your device.',

  netErr:'Could not reach Open-Meteo. Check your internet connection. If the page is open inside another app, open it in Chrome.',
  noData:'No weather data.', favAdd:'Add to favourites', favRemove:'Remove from favourites',
  feels:'Feels like {f}. Today from {lo} to {hi}', wind:'Wind', humidity:'Humidity', clouds:'Cloud cover', pressure:'Pressure',
  uvToday:'UV index (today up to {n})', air:'Air (EAQI)', sun:'Sunrise and sunset', sunVal:'{a} and {b}', daylen:'Daylight', daylenVal:'{h} h {m} min',
  ms:'m/s', hpa:'hPa', mm:'mm', km:'km', mmh:'mm/h',
  today:'Today', tomorrow:'Tomorrow', todayL:'today', tomorrowL:'tomorrow', nowLbl:'Now',
  uv:['low','moderate','high','very high','extreme'],
  aqi:['good','fair','moderate','poor','very poor','extremely poor'],
  dirs:['N','NE','E','SE','S','SW','W','NW'],
  conf:['high','medium','low'], confTitle:'Forecast confidence: {l}. Models differ by {s}°',
  accTitle:'Which model to trust',
  accPick:'Choose a city from the list or add a place to favourites, and the app will start tracking accuracy.',
  accWait:'Collecting data for “{p}”: {t} days collected, {d} verified. At least 2 are needed. The app saves tomorrow’s forecast and compares it with the actual value the next day. Open it again tomorrow.',
  accMean:'Average of three models', accAuto:'Open-Meteo (auto)',
  accNote:'Mean error of the maximum temperature for a 1-day-ahead forecast, days compared: {d}. “Actual” comes from the model analysis, not a weather station. Lower is better.',
  moonTitle:'Moon and night sky',
  moonNames:['New moon','Waxing crescent','First quarter','Waxing gibbous','Full moon','Waning gibbous','Last quarter','Waning crescent'],
  moonLit:'{p}% illuminated, age {a} days', newMoon:'🌑 New moon: {d}', fullMoon:'🌕 Full moon: {d}',
  sky:['Excellent star visibility','Good star visibility','Partly cloudy, some stars','Stars will hardly be visible'],
  skyNote:'Average cloud cover at night: {c}%.', skyMoon:'The bright Moon will light up the sky, so faint stars will be harder to see.',
  countries:{ee:'ESTONIA', lt:'LITHUANIA', by:'BELARUS', ru:'RUSSIA'}, pointName:'Point {a}, {b}',
  phase:['☀️ day','🌅 twilight','🌙 night'], meanClouds:'average cloud cover {c}%, ', moonShort:'Moon {e} {p}%',
  layers:['All','Low','Mid','High'],
  radarNA:'Radar is unavailable right now', agoMin:', {n} min ago', justNow:', now', radarLoading:'Loading radar…',
  ncNA:'A minute-by-minute precipitation forecast is not available for this place.', ncDry:'✅ No precipitation in the next 3 hours',
  ncStart:'☔ Precipitation starts in ~{m} min, up to {v} mm per 15 min', ncAll:'🌧️ Precipitation now, it won’t stop in the next 3 hours', ncEnd:'🌧️ Precipitation now, it ends in ~{m} min',
  wtypes:{storm:'Thunderstorm', rain:'Heavy rain', snow:'Heavy snow', ice:'Freezing rain, ice', wind:'Strong wind', heat:'Extreme heat', frost:'Severe frost', freeze:'Ground frost'},
  gusts:'gusts up to {v} m/s', upHot:'up to {v}', downCold:'down to {v}', upToMm:'up to {v} mm/h', ongoing:'already happening, until {t}',
  noDanger:'✅ No dangerous weather expected in the next {h} hours (places monitored: {n}).',
  cfgStorm:'Thunderstorm', cfgRain:'Heavy rain from', cfgSnow:'Heavy snow', cfgIce:'Freezing rain', cfgWind:'Wind gusts from', cfgHeat:'Heat from',
  cfgFrost:'Frost down to', cfgFreeze:'Ground frost down to (for the garden)', cfgOfficial:'Official LVĢMC warnings', cfgLook:'Look ahead', hours:'hours',
  close:'Close', hourTip:'{d} {h}: {t}, precipitation {p}%',
  favFull:'Favourites are full', favFullTxt:'You can save up to 8 places. Remove one by tapping ★.', favNamePrompt:'Place name', favDefault:'My place',
  notFound:'Nothing found', offline:'offline, retrying', dataAt:'data as of {t}, next check in {s} s',

  nUnsupported:'this browser does not support notifications (open it in Chrome, not in the built-in browser of Telegram, Instagram, etc.)',
  nDenied:'notifications are blocked for this site', nNotYet:'permission not granted yet',
  nNoSW:'the sw.js helper file did not start (check that it is uploaded next to index.html)',
  nNeedHttps:'an https address is required (GitHub Pages); notifications do not work from a file',
  nRejected:'Android rejected the notification: {e}', nRegFail:'the sw.js helper file could not be registered: {e}',
  bgNo:'Background checks while the app is closed are not supported in this browser.',
  bgInstall:'To get warnings while the app is closed, install it: Chrome menu ⋮, “Install app”, and open it from the icon.',
  bgOn:'Background check is on: Chrome runs it on its own, usually every few hours.',
  howBrowser:'Chrome: tap the lock or settings icon left of the address → “Permissions” → “Notifications” → “Allow”. Or ⋮ → Settings → Site settings → Notifications.',
  howApp:'Long-press the Laiks icon on your home screen → “App info” (ⓘ) → “Notifications” → turn on.',
  howOS:'Also check Android Settings → Apps → Chrome (or Laiks) → Notifications: they must be on, and Do Not Disturb must be off.',
  stUnsupported:'System notifications are not available here. Open the app address in Chrome. On-page pop-ups and vibration still work.',
  stGranted:'Notification permission granted. Tap “Test”: a notification should appear in the Android notification shade.',
  stDenied:'Notifications are blocked. ', stDefault:'Tap “Enable notifications” and choose “Allow”.',
  stHttps:'An https address (GitHub Pages) is required: system notifications do not work from a local file.', stLastErr:'Last error: {e}.',
  diag:'Diagnostics: permission {p}, helper file {s}, mode {m}.',
  diagP:{granted:'granted', denied:'blocked', default:'not granted', unsupported:'no API'},
  diagSWok:'running', diagSWno:'not running', modeApp:'installed app', modeBrowser:'browser',
  quietTitle:'Chrome hid the request', quietTxt:'Tap the 🔔 or lock icon in the address bar and allow notifications. ',
  deniedTitle:'Notifications blocked', testTitle:'Warning test', testBody:'This is how a bad-weather warning will look.',
  sentTitle:'Notification sent', sentBody:'Check the Android notification shade. If it isn’t there: ', notSentTitle:'Notification not sent',

  offTitle:'Official warnings (LVĢMC)', offNone:'✅ No official warnings for Latvia right now.',
  offFail:'The official warnings did not load. See them on the {lv} or {ma} website.', offLoading:'Loading official warnings…',
  levels:{yellow:'Yellow level', orange:'Orange level', red:'Red level'},
  offAreas:'Areas: {a}', offHere:'📍 affects the selected place', offFrom:'{a} – {b}', offMore:'Details',
  modelTitle:'From the forecast model (next {h} h)', offSource:'Source: LVĢMC via MeteoAlarm',
  mtypes:{1:'Wind',2:'Snow and ice',3:'Thunderstorm',4:'Fog',5:'High temperature',6:'Low temperature',7:'Coastal event',8:'Forest fire',9:'Avalanche',10:'Rain',12:'Flooding',13:'Rain and flooding'},

  todayRange:'From {lo} to {hi}, feels like {flo} to {fhi}.',
  wear:['Winter down jacket, hat, scarf, mittens, thermal underwear','Winter jacket, hat and gloves','Warm jacket, hat, gloves','Mid-season jacket or coat','Light jacket or sweater','Long sleeves or a shirt, a light jacket for the evening','T-shirt and light clothes'],
  umbrellaYes:'Take an umbrella: rain likely from {t}', umbrellaMaybe:'Umbrella just in case: chance of precipitation up to {p}%', umbrellaNo:'No umbrella needed',
  snowShoes:'Snow: waterproof shoes with a good grip', windy:'Windy, gusts up to {g} m/s: a hood beats an umbrella',
  sunscreen:'UV up to {u}: sunscreen and sunglasses', iceRisk:'Possible black ice: careful on pavements and roads',

  seaWater:'Water', seaWave:'Waves', seaMax:'max in 24 h {v} m', seaPeriod:'period {s} s', seaState:['calm','moderate','rough','storm'],
  seaNA:'No data', seaNote:'Open-Meteo Marine model data (DWD, Météo-France). Not suitable for navigation.',
  pollenTypes:{alder:'Alder', birch:'Birch', grass:'Grass', mugwort:'Mugwort', ragweed:'Ragweed'},
  pollenLevels:['none','low','moderate','high','very high'],
  pollenOff:'It is not pollen season now, so there is no pollen data. The European CAMS service publishes it in spring and summer.',
  pollenNote:'Today’s maximum, grains per m³. Levels are approximate.', pollenNA:'Pollen data did not load.',

  roadNowOpt:'now', roadIn:'in {h} h', roadSummary:'{a} → {b}: ~{km} km, ~{dur}. Departure {t1}, arrival ~{t2}.', dur:'{h} h {m} min',
  roadStraight:'Straight-line route, approximate.', roadOK:'✅ No dangerous conditions expected on the route',
  roadWarn:'⚠️ Take care: {r}', roadDanger:'⛔ Dangerous: {r}',
  rIce:'ice', rIceRisk:'possible black ice', rFrost:'frost on the road', rSnow:'snow', rSnowHeavy:'heavy snow',
  rFog:'fog, visibility {v}', rRain:'heavy rain', rWind:'gusts up to {g} m/s', rFreezeRain:'freezing rain',
  roadAir:'air', roadSurf:'road', roadVis:'visibility', roadOkShort:'normal',
  roadNote:'Surface temperature and visibility are Open-Meteo model estimates, not road sensor data. The assumed speed is about 75 km/h. Official road information: {lvc}.',
  roadSame:'Choose two different places', roadLoading:'Calculating the route…', roadFail:'Could not get a forecast for the route.', visKm:'{v} km', visM:'{v} m',

  wmo:{0:'Clear',1:'Mostly clear',2:'Partly cloudy',3:'Overcast',45:'Fog',48:'Rime fog',51:'Light drizzle',53:'Drizzle',55:'Heavy drizzle',
    56:'Freezing drizzle',57:'Freezing drizzle',61:'Light rain',63:'Rain',65:'Heavy rain',66:'Freezing rain',67:'Freezing rain',71:'Light snow',
    73:'Snow',75:'Heavy snow',77:'Snow grains',80:'Showers',81:'Heavy showers',82:'Violent showers',85:'Snow showers',86:'Heavy snow showers',
    95:'Thunderstorm',96:'Thunderstorm with hail',99:'Thunderstorm with hail'}
}
};

/* подписи визуализаций (приборы, графики, живое небо) */
Object.assign(I18N.ru, {
  gUV:'УФ-индекс', gAir:'Воздух', gSun:'Солнце', pUp:'растёт', pDown:'падает', pFlat:'стабильно',
  sunLeft:'до заката {h} ч {m} мин', sunRise:'до восхода {h} ч {m} мин', gustShort:'порывы {v}',
  precipBand:'Вероятность осадков', tempScale:'цвет линии — температура',
  hourTip2:'{d} {h}: {t} · осадки {p}%, {mm} мм', skyAria:'Анимация неба по текущей погоде'
});
Object.assign(I18N.lv, {
  gUV:'UV indekss', gAir:'Gaiss', gSun:'Saule', pUp:'pieaug', pDown:'krītas', pFlat:'stabils',
  sunLeft:'līdz rietam {h} h {m} min', sunRise:'līdz lēktam {h} h {m} min', gustShort:'brāzmas {v}',
  precipBand:'Nokrišņu varbūtība', tempScale:'līnijas krāsa — temperatūra',
  hourTip2:'{d} {h}: {t} · nokrišņi {p}%, {mm} mm', skyAria:'Debesu animācija pēc pašreizējiem laikapstākļiem'
});
Object.assign(I18N.en, {
  gUV:'UV index', gAir:'Air', gSun:'Sun', pUp:'rising', pDown:'falling', pFlat:'steady',
  sunLeft:'{h} h {m} min to sunset', sunRise:'{h} h {m} min to sunrise', gustShort:'gusts {v}',
  precipBand:'Chance of precipitation', tempScale:'line colour shows temperature',
  hourTip2:'{d} {h}: {t} · precip. {p}%, {mm} mm', skyAria:'Sky animation for the current weather'
});

/* карты и строка обновления */
Object.assign(I18N.ru, {
  updatedAt:'обновлено в {t}', ml:{clouds:'Облака', precip:'Осадки', temp:'Температура', wind:'Ветер'}, mmh:'мм/ч',
  windLines:'линии — ветер', meanPrecip:'осадки в среднем {v} мм/ч, ', meanTemp:'в среднем {v}, ',
  mapTitle:'Карта погоды на 3 дня',
  mapNote:'Нажмите на город или любую точку карты, чтобы открыть прогноз. Красная рамка — опасная погода в выбранный час, цветная линия — ваш маршрут. Слои — прогноз модели, а не снимок со спутника. На телефоне карту можно двигать после приближения двумя пальцами.'
});
Object.assign(I18N.lv, {
  updatedAt:'atjaunināts {t}', ml:{clouds:'Mākoņi', precip:'Nokrišņi', temp:'Temperatūra', wind:'Vējš'}, mmh:'mm/h',
  windLines:'līnijas — vējš', meanPrecip:'nokrišņi vidēji {v} mm/h, ', meanTemp:'vidēji {v}, ',
  mapTitle:'Laikapstākļu karte 3 dienām',
  mapNote:'Pieskarieties pilsētai vai jebkuram kartes punktam, lai atvērtu prognozi. Sarkans rāmis — bīstami laikapstākļi izvēlētajā stundā, krāsaina līnija — jūsu maršruts. Slāņi ir modeļa prognoze, nevis satelīta attēls. Tālrunī karti var pārvietot pēc pietuvināšanas ar diviem pirkstiem.'
});
Object.assign(I18N.en, {
  updatedAt:'updated {t}', ml:{clouds:'Clouds', precip:'Precipitation', temp:'Temperature', wind:'Wind'}, mmh:'mm/h',
  windLines:'lines show wind', meanPrecip:'avg. precipitation {v} mm/h, ', meanTemp:'average {v}, ',
  mapTitle:'Weather map, 3 days',
  mapNote:'Tap a town or any point on the map to open its forecast. A red frame means dangerous weather at the selected hour, the coloured line is your route. Layers are a model forecast, not a satellite image. On a phone, pinch to zoom in before panning.'
});

/* режим в пути */
Object.assign(I18N.ru, {
  driveTitle:'Режим в пути', driveOn:'🚗 Включить', driveOff:'⏹ Выключить', dVoice:'Голосовые предупреждения', dEco:'Экономия батареи',
  dTest:'🔊 Проверить голос', dDark:'🌑 Тёмный экран', voiceAuto:'Голос: автоматически', kmh:'км/ч',
  driveNote:'Приложение следит за погодой здесь и впереди по ходу движения (10, 25 и 50 км) и предупреждает голосом о гололёде, снеге, тумане, ветре и грозе. Работает, пока приложение открыто: экран не гаснет. «Экономия батареи» — менее точный GPS и проверка раз в 5 минут или 5 км. Координаты не сохраняются.',
  dIdle:'Выключено. Включите перед поездкой и оставьте приложение открытым.', dWaiting:'Определяю местоположение…',
  dDenied:'Нет доступа к местоположению. Разрешите его для этого сайта: значок замка в адресной строке → Разрешения → Местоположение.',
  dNoGeo:'Это устройство не сообщает местоположение.', dNoFix:'GPS пока не отвечает, жду сигнал.', dNet:'Не удалось получить прогноз, повторю позже.',
  dHere:'Здесь', dAhead:'Через {d} километров', dHereCap:'Здесь', dAheadCap:'Через {d} км', dEta:'≈ {m} мин', dOk:'без опасностей',
  dRoad:'дорога {v}', dAcc:'точность {a} м', dChecked:'проверено {t}', dStationary:'Вы стоите или едете медленно — показываю погоду на месте.',
  driveAlert:'Опасно в пути', voiceHello:'Режим в пути включён. Я предупрежу об опасной погоде на дороге.',
  voiceWarn:'Внимание! {where}: {what}. Будьте осторожны.', voiceTest:'Внимание! Через двадцать пять километров возможна гололедица. Будьте осторожны.',
  dDarkHint:'Коснитесь экрана, чтобы вернуться'
});
Object.assign(I18N.lv, {
  driveTitle:'Ceļā', driveOn:'🚗 Ieslēgt', driveOff:'⏹ Izslēgt', dVoice:'Balss brīdinājumi', dEco:'Akumulatora taupīšana',
  dTest:'🔊 Pārbaudīt balsi', dDark:'🌑 Tumšs ekrāns', voiceAuto:'Balss: automātiski', kmh:'km/h',
  driveNote:'Lietotne seko laikapstākļiem šeit un priekšā braukšanas virzienā (10, 25 un 50 km) un ar balsi brīdina par apledojumu, sniegu, miglu, vēju un pērkona negaisu. Darbojas, kamēr lietotne ir atvērta: ekrāns neizslēdzas. «Akumulatora taupīšana» — mazāk precīzs GPS un pārbaude reizi 5 minūtēs vai 5 km. Koordinātas netiek saglabātas.',
  dIdle:'Izslēgts. Ieslēdziet pirms brauciena un atstājiet lietotni atvērtu.', dWaiting:'Nosaku atrašanās vietu…',
  dDenied:'Nav piekļuves atrašanās vietai. Atļaujiet to šai vietnei: slēdzenes ikona adreses joslā → Atļaujas → Atrašanās vieta.',
  dNoGeo:'Šī ierīce nesniedz atrašanās vietu.', dNoFix:'GPS vēl neatbild, gaidu signālu.', dNet:'Neizdevās iegūt prognozi, mēģināšu vēlāk.',
  dHere:'Šeit', dAhead:'Pēc {d} kilometriem', dHereCap:'Šeit', dAheadCap:'Pēc {d} km', dEta:'≈ {m} min', dOk:'bez briesmām',
  dRoad:'ceļš {v}', dAcc:'precizitāte {a} m', dChecked:'pārbaudīts {t}', dStationary:'Jūs stāvat vai braucat lēni — rādu laikapstākļus uz vietas.',
  driveAlert:'Bīstami ceļā', voiceHello:'Režīms ceļā ieslēgts. Es brīdināšu par bīstamiem laikapstākļiem uz ceļa.',
  voiceWarn:'Uzmanību! {where}: {what}. Esiet uzmanīgi.', voiceTest:'Uzmanību! Pēc divdesmit pieciem kilometriem iespējams apledojums. Esiet uzmanīgi.',
  dDarkHint:'Pieskarieties ekrānam, lai atgrieztos'
});
Object.assign(I18N.en, {
  driveTitle:'Drive mode', driveOn:'🚗 Turn on', driveOff:'⏹ Turn off', dVoice:'Voice warnings', dEco:'Battery saver',
  dTest:'🔊 Test voice', dDark:'🌑 Dark screen', voiceAuto:'Voice: automatic', kmh:'km/h',
  driveNote:'The app watches the weather here and ahead in your direction of travel (10, 25 and 50 km) and gives voice warnings about ice, snow, fog, wind and thunderstorms. It works while the app is open: the screen stays on. Battery saver uses less precise GPS and checks every 5 minutes or 5 km. Your location is not stored.',
  dIdle:'Off. Turn it on before you drive and keep the app open.', dWaiting:'Finding your location…',
  dDenied:'No access to location. Allow it for this site: lock icon in the address bar → Permissions → Location.',
  dNoGeo:'This device does not provide location.', dNoFix:'No GPS fix yet, waiting for a signal.', dNet:'Could not get the forecast, will retry.',
  dHere:'Here', dAhead:'In {d} kilometres', dHereCap:'Here', dAheadCap:'In {d} km', dEta:'≈ {m} min', dOk:'no hazards',
  dRoad:'road {v}', dAcc:'accuracy {a} m', dChecked:'checked {t}', dStationary:'You are stopped or moving slowly — showing the weather where you are.',
  driveAlert:'Danger on the road', voiceHello:'Drive mode is on. I will warn you about dangerous weather on the road.',
  voiceWarn:'Attention! {where}: {what}. Please drive carefully.', voiceTest:'Attention! In twenty five kilometres there may be ice on the road. Please drive carefully.',
  dDarkHint:'Tap the screen to return'
});

/* советы на сегодня: мойка, лучшее окно, закат */
Object.assign(I18N.ru, {
  planTitle:'Советы на сегодня', washTitle:'Когда мыть машину', washToday:'Мойте сегодня', washTomorrow:'Лучше мыть завтра',
  washOn:'Лучше мыть: {d}', washDry:'Следующие 2 дня без осадков — чистота продержится.', washDryAfter:'После этого 2 дня сухо.',
  washWait:'Пока не стоит мыть', washRain:'В ближайшие 2 дня осадки (до {mm} мм).', washSnow:'Ожидается снег.',
  washSalt:'Мокрые дороги около нуля — будут реагенты.', washCold:'Мороз: выбирайте мойку с сушкой и протрите уплотнители дверей.',
  winTitle:'Лучшее время', acts:{walk:'Прогулка', run:'Пробежка', bike:'Велосипед', bbq:'Шашлык'},
  winToday:'Сегодня {a}–{b}', winTomorrow:'Завтра {a}–{b}', winDetail:'ощущается {t}, осадки {p}%, ветер {w} м/с',
  noWindow:'Подходящего времени не нашлось.', scoreLbl:['отлично','хорошо','так себе','плохо'],
  sunsetToday:'Закат сегодня', sunsetTom:'Закат завтра', sunsetAt:'Закат в {t}, солнце садится на {d}',
  goldenH:'Золотой час {a}–{b}', blueH:'Синий час {a}–{b}', sunriseTom:'Рассвет завтра в {t}: {l}',
  sunLbl:['огненный, очень яркий','красивый, с красками','обычный','скорее не будет видно']
});
Object.assign(I18N.lv, {
  planTitle:'Padomi šodienai', washTitle:'Kad mazgāt auto', washToday:'Mazgājiet šodien', washTomorrow:'Labāk mazgāt rīt',
  washOn:'Labāk mazgāt: {d}', washDry:'Nākamās 2 dienas bez nokrišņiem — tīrība saglabāsies.', washDryAfter:'Pēc tam 2 dienas sauss.',
  washWait:'Pagaidām nav vērts mazgāt', washRain:'Tuvākajās 2 dienās nokrišņi (līdz {mm} mm).', washSnow:'Gaidāms sniegs.',
  washSalt:'Slapji ceļi ap nulli — būs pretslīdes reaģenti.', washCold:'Sals: izvēlieties mazgātuvi ar žāvēšanu un noslaukiet durvju blīves.',
  winTitle:'Labākais laiks', acts:{walk:'Pastaiga', run:'Skriešana', bike:'Velosipēds', bbq:'Šašliks'},
  winToday:'Šodien {a}–{b}', winTomorrow:'Rīt {a}–{b}', winDetail:'sajūta {t}, nokrišņi {p}%, vējš {w} m/s',
  noWindow:'Piemērots laiks netika atrasts.', scoreLbl:['lieliski','labi','tā nekas','slikti'],
  sunsetToday:'Saulriets šodien', sunsetTom:'Saulriets rīt', sunsetAt:'Saulriets {t}, saule riet {d}',
  goldenH:'Zelta stunda {a}–{b}', blueH:'Zilā stunda {a}–{b}', sunriseTom:'Saullēkts rīt {t}: {l}',
  sunLbl:['ugunīgs, ļoti spilgts','skaists, krāsains','parasts','visticamāk nebūs redzams']
});
Object.assign(I18N.en, {
  planTitle:'Tips for today', washTitle:'When to wash the car', washToday:'Wash it today', washTomorrow:'Better wash it tomorrow',
  washOn:'Best day to wash: {d}', washDry:'No precipitation for the next 2 days — it will stay clean.', washDryAfter:'Dry for 2 days after that.',
  washWait:'Not worth washing yet', washRain:'Precipitation in the next 2 days (up to {mm} mm).', washSnow:'Snow is expected.',
  washSalt:'Wet roads around freezing — de-icing salt likely.', washCold:'Frost: choose a wash with drying and wipe the door seals.',
  winTitle:'Best time', acts:{walk:'Walk', run:'Run', bike:'Bike', bbq:'Barbecue'},
  winToday:'Today {a}–{b}', winTomorrow:'Tomorrow {a}–{b}', winDetail:'feels {t}, precip. {p}%, wind {w} m/s',
  noWindow:'No suitable time found.', scoreLbl:['excellent','good','so-so','poor'],
  sunsetToday:'Sunset today', sunsetTom:'Sunset tomorrow', sunsetAt:'Sunset at {t}, the sun sets in the {d}',
  goldenH:'Golden hour {a}–{b}', blueH:'Blue hour {a}–{b}', sunriseTom:'Sunrise tomorrow at {t}: {l}',
  sunLbl:['fiery, very vivid','beautiful, colourful','ordinary','probably not visible']
});

/* ---------- пояснения к приборам главной карточки (касание по прибору) ---------- */
Object.assign(I18N.ru, {gi:{
  open:'Пояснение', close:'Закрыть', how:'Как читать', scale:'Шкала', now:'Сейчас',
  wind:{
    ico:'💨', head:'{v} м/с · {n}',
    lv:[['0–1.5','штиль, тихий','дым поднимается почти вертикально'],['1.6–3.3','лёгкий','ветер ощущается лицом, шелестят листья'],['3.4–5.4','слабый','колышутся листья и тонкие ветки, флаги развеваются'],['5.5–7.9','умеренный','поднимает пыль и бумажки, качаются ветки'],['8–10.7','свежий','качаются небольшие деревья, на воде барашки'],['10.8–13.8','сильный','качаются толстые ветки, зонт держать трудно'],['13.9–17.1','крепкий','качаются деревья, идти против ветра трудно'],['17.2–20.7','очень крепкий','ломаются ветки, опасно у деревьев'],['20.8+','шторм','падают деревья, возможны разрушения']],
    nowTxt:'{v} м/с — это {kmh} км/ч, {bf} по шкале Бофорта: {e}.',
    gust:'Порывы до {g} м/с: короткие усиления на несколько секунд. Именно они ломают зонты и ветки.',
    gustBad:'Порывы до {g} м/с опасны: держитесь подальше от деревьев, рекламных щитов и строительных лесов.',
    dir:'Ветер дует {f}.',
    feel:'Из-за ветра и влажности на улице ощущается как {f} при {t} на термометре.',
    sea:'Западный и юго-западный ветер в Латвии обычно несёт влажный воздух с Балтики: облака, дождь, мягкая погода.',
    land:'Восточный и северный ветер обычно приносит сухой воздух: ясно, зимой мороз, ночью прохладно.',
    south:'Южный ветер обычно тёплый.',
    from:['с севера','с северо-востока','с востока','с юго-востока','с юга','с юго-запада','с запада','с северо-запада'],
    how:'Большое число — средняя скорость ветра в метрах в секунду. Голубая стрелка стоит на той стороне круга, откуда дует ветер, и указывает, куда он дует. «С» сверху — север. Ниже — сторона света, откуда дует ветер, и сила порывов.',
    tip:'Скорость в прогнозе дана на высоте 10 м над открытой местностью. Между домами ветер обычно слабее, а на побережье, мостах и в поле сильнее.'
  },
  hum:{
    ico:'💧', head:'{v}% · {n}',
    lv:[['0–30%','очень сухо','сохнут кожа и губы'],['30–40%','сухо','лёгкая сухость'],['40–60%','комфортно','идеально для человека'],['60–80%','влажно','обычно для Латвии'],['80–100%','очень влажно','сырость, возможны туман и морось']],
    nowTxt:'Воздух содержит {v}% от того количества влаги, которое он может удержать при {t}.',
    dew:'Точка росы {d}: если воздух остынет до этой температуры, выпадет роса, появится туман или иней.',
    fog:'До точки росы осталось всего {k}°: вероятны туман, морось и мокрые поверхности.',
    raw:'Сырой холод: при высокой влажности прохлада ощущается сильнее, одежда быстрее отсыревает.',
    muggy:'Точка росы выше 18°: воздух душный, тяжело заниматься спортом.',
    cloud:'☁️ {c}% — доля неба, закрытая облаками: до 20% ясно, 30–60% переменная облачность, 70–90% облачно, 100% пасмурно.',
    how:'Дуга и число — относительная влажность. Это не «сколько воды в воздухе», а насколько воздух близок к насыщению при нынешней температуре. Поэтому ночью, когда холодает, влажность растёт, а днём падает.',
    tip:'Зимой при проветривании холодный уличный воздух нагревается и становится сухим, даже если на улице 90%. Дома комфортно 40–60%.'
  },
  uv:{
    ico:'🕶️', head:'{v} · {n}',
    lv:[['0–2','низкий','защита не нужна'],['3–5','умеренный','в полдень очки, головной убор, крем SPF 30'],['6–7','высокий','с 12 до 16 ищите тень, крем SPF 30–50'],['8–10','очень высокий','избегайте солнца в полдень'],['11+','экстремальный','без защиты на солнце лучше не выходить']],
    nowTxt:'Сейчас индекс {v}: {e}.',
    max:'Максимум сегодня около {m}, в солнечный полдень примерно в {n}.',
    need:'Защита от солнца нужна при индексе 3 и выше.',
    how:'УФ-индекс показывает силу ультрафиолета, от которого бывают загар и ожоги. Чем выше число, тем быстрее можно обгореть. Он зависит от высоты Солнца, облаков и озона и сильнее всего в полдень.',
    tip:'Тонкие облака пропускают до 80% ультрафиолета. Вода, песок и снег его отражают. В Латвии индекс 3 и выше бывает примерно с апреля по сентябрь.'
  },
  air:{
    ico:'🍃', head:'{v} EAQI · {n}',
    lv:[['0–20','хороший','без ограничений'],['20–40','приемлемый','без ограничений'],['40–60','умеренный','чувствительным людям — меньше нагрузки на улице'],['60–80','плохой','всем снизить нагрузку на улице'],['80–100','очень плохой','избегать нагрузок на улице'],['100+','крайне плохой','по возможности оставаться дома']],
    nowTxt:'Индекс {v}: {e}.',
    main:'Больше всего влияет {p}.',
    pol:{pm2_5:'мелкая пыль PM2.5 (дым, выхлоп, печное отопление)', pm10:'пыль PM10 (дороги, стройки, песок)', nitrogen_dioxide:'диоксид азота NO₂ (транспорт)', ozone:'озон O₃ (образуется на солнце в жару)'},
    conc:'PM2.5 {a} · PM10 {b} · NO₂ {c} · O₃ {d} мкг/м³',
    how:'Европейский индекс качества воздуха (EAQI): берётся худший из показателей — мелкие частицы PM2.5 и PM10, диоксид азота и озон. Меньше — лучше. Это прогноз модели CAMS для этого места, а не замер ближайшей станции.',
    tip:'Пыльца в индекс не входит — смотрите карточку «Пыльца». В тихие морозные вечера в районах с печным отоплением воздух обычно хуже.'
  },
  pres:{
    ico:'🧭', head:'{v} гПа · {n}',
    lv:[['< 990','очень низкое','глубокий циклон: ветер, осадки'],['990–1005','пониженное','облачно, часто осадки'],['1005–1020','обычное','норма около 1013'],['1020–1030','повышенное','антициклон: сухо, малооблачно'],['> 1030','высокое','ясно; зимой сильный мороз, летом жара']],
    nowTxt:'{v} гПа = {mm} мм рт. ст. Давление {n}: {e}.',
    down:'За 3 часа падает на {x} гПа. Так обычно приближается циклон или фронт: облака, осадки и усиление ветра в ближайшие 6–24 часа.',
    fast:'Падает быстро ({x} гПа за 3 часа) — признак сильного ветра.',
    up:'За 3 часа растёт на {x} гПа: погода обычно улучшается, ветер слабеет.',
    flat:'Почти не меняется: погода, скорее всего, останется такой же.',
    how:'Стрелка показывает давление на шкале от 960 до 1050 гПа. Средняя отметка — 1013 гПа, это норма. Значение приведено к уровню моря, поэтому домашний барометр без настройки покажет меньше: примерно на 1 гПа на каждые 8 м высоты.',
    tip:'Важнее не само число, а куда оно движется: ↗ растёт, → стабильно, ↘ падает.'
  },
  sun:{
    ico:'🌅', head:'{a} – {b}',
    len:'Световой день {h} ч {m} мин; завтра {d}.', longer:'на {n} мин длиннее', shorter:'на {n} мин короче', same:'такой же',
    noon:'Солнце выше всего в {t}: {e}° над горизонтом.',
    dusk:'После заката ещё светло примерно до {t} (гражданские сумерки).',
    dawn:'Светать начнёт около {t}, восход в {r}.',
    how:'Дуга — путь Солнца по небу сегодня: слева время восхода, справа заката. Жёлтая точка показывает, где Солнце сейчас. Внизу — сколько осталось до заката, а ночью — до восхода.',
    tip:'В Латвии день длится от неполных 7 часов в декабре до почти 18 часов в июне. Золотой час и прогноз красивого заката — в карточке «Советы на сегодня».'
  }
}});
Object.assign(I18N.lv, {gi:{
  open:'Skaidrojums', close:'Aizvērt', how:'Kā lasīt', scale:'Skala', now:'Tagad',
  wind:{
    ico:'💨', head:'{v} m/s · {n}',
    lv:[['0–1.5','bezvējš, kluss','dūmi kāpj gandrīz vertikāli'],['1.6–3.3','viegls','vējš jūtams sejā, šalc lapas'],['3.4–5.4','vājš','kustas lapas un tievi zari, plīvo karogi'],['5.5–7.9','mērens','ceļ putekļus un papīrus, šūpojas zari'],['8–10.7','svaigs','šūpojas nelieli koki, uz ūdens viļņu galotnes'],['10.8–13.8','stiprs','šūpojas resni zari, lietussargu grūti noturēt'],['13.9–17.1','ļoti stiprs','šūpojas koki, grūti iet pret vēju'],['17.2–20.7','vētrains','lūst zari, bīstami pie kokiem'],['20.8+','vētra','krīt koki, iespējami postījumi']],
    nowTxt:'{v} m/s ir {kmh} km/h, {bf} pēc Boforta skalas: {e}.',
    gust:'Brāzmas līdz {g} m/s: īslaicīgi pastiprinājumi uz dažām sekundēm. Tieši tās lauž lietussargus un zarus.',
    gustBad:'Brāzmas līdz {g} m/s ir bīstamas: turieties tālāk no kokiem, reklāmas stendiem un sastatnēm.',
    dir:'Vējš pūš {f}.',
    feel:'Vēja un mitruma dēļ ārā jūtas kā {f}, termometrs rāda {t}.',
    sea:'Rietumu un dienvidrietumu vējš Latvijā parasti nes mitru gaisu no Baltijas jūras: mākoņi, lietus, maigs laiks.',
    land:'Austrumu un ziemeļu vējš parasti nes sausu gaisu: skaidrs, ziemā sals, naktīs vēss.',
    south:'Dienvidu vējš parasti ir silts.',
    from:['no ziemeļiem','no ziemeļaustrumiem','no austrumiem','no dienvidaustrumiem','no dienvidiem','no dienvidrietumiem','no rietumiem','no ziemeļrietumiem'],
    how:'Lielais skaitlis ir vidējais vēja ātrums metros sekundē. Zilā bultiņa atrodas tajā apļa pusē, no kuras pūš vējš, un rāda, uz kurieni tas pūš. «Z» augšā ir ziemeļi. Zemāk — debespuse, no kuras pūš vējš, un brāzmu stiprums.',
    tip:'Prognozē ātrums dots 10 m augstumā virs atklāta apvidus. Starp mājām vējš parasti ir vājāks, bet piekrastē, uz tiltiem un laukā — stiprāks.'
  },
  hum:{
    ico:'💧', head:'{v}% · {n}',
    lv:[['0–30%','ļoti sauss','sausē āda un lūpas'],['30–40%','sauss','neliels sausums'],['40–60%','komfortabli','ideāli cilvēkam'],['60–80%','mitrs','Latvijai ierasti'],['80–100%','ļoti mitrs','drēgns, iespējama migla un smidzinājums']],
    nowTxt:'Gaisā ir {v}% no mitruma daudzuma, ko tas var noturēt pie {t}.',
    dew:'Rasas punkts {d}: ja gaiss atdzisīs līdz šai temperatūrai, nokritīs rasa, veidosies migla vai sarma.',
    fog:'Līdz rasas punktam palikuši tikai {k}°: iespējama migla, smidzinājums un slapjas virsmas.',
    raw:'Drēgns aukstums: augstā mitrumā vēsums jūtams stiprāk, apģērbs ātrāk kļūst mitrs.',
    muggy:'Rasas punkts virs 18°: gaiss ir smacīgs, grūti sportot.',
    cloud:'☁️ {c}% — mākoņu klātā debess daļa: līdz 20% skaidrs, 30–60% mainīgs mākoņu daudzums, 70–90% mākoņains, 100% apmācies.',
    how:'Loks un skaitlis ir relatīvais mitrums. Tas nav «cik ūdens ir gaisā», bet gan cik tuvu gaiss ir piesātinājumam pie pašreizējās temperatūras. Tāpēc naktī, kad kļūst vēsāks, mitrums pieaug, bet dienā samazinās.',
    tip:'Ziemā vēdinot aukstais āra gaiss sasilst un kļūst sauss, pat ja ārā ir 90%. Mājās komfortabli ir 40–60%.'
  },
  uv:{
    ico:'🕶️', head:'{v} · {n}',
    lv:[['0–2','zems','aizsardzība nav vajadzīga'],['3–5','mērens','pusdienlaikā brilles, cepure, krēms SPF 30'],['6–7','augsts','no 12 līdz 16 meklējiet ēnu, krēms SPF 30–50'],['8–10','ļoti augsts','izvairieties no saules pusdienlaikā'],['11+','ekstrēms','bez aizsardzības saulē labāk neiet']],
    nowTxt:'Tagad indekss {v}: {e}.',
    max:'Šodien maksimums ap {m}, saules pusdienlaikā ap {n}.',
    need:'Aizsardzība no saules vajadzīga, ja indekss ir 3 un vairāk.',
    how:'UV indekss rāda ultravioletā starojuma stiprumu, no kura rodas iedegums un apdegumi. Jo lielāks skaitlis, jo ātrāk var apdegt. Tas atkarīgs no Saules augstuma, mākoņiem un ozona, un ir vislielākais pusdienlaikā.',
    tip:'Plāni mākoņi laiž cauri līdz 80% UV starojuma. Ūdens, smiltis un sniegs to atstaro. Latvijā indekss 3 un vairāk ir aptuveni no aprīļa līdz septembrim.'
  },
  air:{
    ico:'🍃', head:'{v} EAQI · {n}',
    lv:[['0–20','labs','bez ierobežojumiem'],['20–40','pieņemams','bez ierobežojumiem'],['40–60','mērens','jutīgiem cilvēkiem mazāk slodzes ārā'],['60–80','slikts','visiem samazināt slodzi ārā'],['80–100','ļoti slikts','izvairīties no slodzes ārā'],['100+','ārkārtīgi slikts','ja iespējams, palikt mājās']],
    nowTxt:'Indekss {v}: {e}.',
    main:'Visvairāk ietekmē {p}.',
    pol:{pm2_5:'smalkās daļiņas PM2.5 (dūmi, izplūdes gāzes, krāšņu apkure)', pm10:'putekļi PM10 (ceļi, būvdarbi, smiltis)', nitrogen_dioxide:'slāpekļa dioksīds NO₂ (transports)', ozone:'ozons O₃ (veidojas saulē karstumā)'},
    conc:'PM2.5 {a} · PM10 {b} · NO₂ {c} · O₃ {d} µg/m³',
    how:'Eiropas gaisa kvalitātes indekss (EAQI): ņem sliktāko no rādītājiem — smalkās daļiņas PM2.5 un PM10, slāpekļa dioksīdu un ozonu. Mazāk ir labāk. Tā ir CAMS modeļa prognoze šai vietai, nevis tuvākās stacijas mērījums.',
    tip:'Ziedputekšņi indeksā neietilpst — skatiet karti «Ziedputekšņi». Klusos salnos vakaros rajonos ar krāšņu apkuri gaiss parasti ir sliktāks.'
  },
  pres:{
    ico:'🧭', head:'{v} hPa · {n}',
    lv:[['< 990','ļoti zems','dziļš ciklons: vējš, nokrišņi'],['990–1005','pazemināts','mākoņains, bieži nokrišņi'],['1005–1020','parasts','norma ap 1013'],['1020–1030','paaugstināts','anticiklons: sauss, maz mākoņu'],['> 1030','augsts','skaidrs; ziemā stiprs sals, vasarā karstums']],
    nowTxt:'{v} hPa = {mm} mm dz. st. Spiediens {n}: {e}.',
    down:'3 stundās krītas par {x} hPa. Tā parasti tuvojas ciklons vai fronte: mākoņi, nokrišņi un vēja pastiprināšanās tuvāko 6–24 stundu laikā.',
    fast:'Krītas ātri ({x} hPa 3 stundās) — stipra vēja pazīme.',
    up:'3 stundās pieaug par {x} hPa: laiks parasti uzlabojas, vējš pierimst.',
    flat:'Gandrīz nemainās: laiks, visticamāk, paliks tāds pats.',
    how:'Bultiņa rāda spiedienu skalā no 960 līdz 1050 hPa. Vidējā atzīme — 1013 hPa, tā ir norma. Vērtība pārrēķināta uz jūras līmeni, tāpēc neiestatīts mājas barometrs rādīs mazāk: aptuveni par 1 hPa uz katriem 8 m augstuma.',
    tip:'Svarīgāks par pašu skaitli ir virziens: ↗ pieaug, → stabils, ↘ krītas.'
  },
  sun:{
    ico:'🌅', head:'{a} – {b}',
    len:'Gaišais laiks {h} h {m} min; rīt {d}.', longer:'par {n} min garāks', shorter:'par {n} min īsāks', same:'tikpat garš',
    noon:'Saule visaugstāk {t}: {e}° virs horizonta.',
    dusk:'Pēc saulrieta vēl gaišs aptuveni līdz {t} (pilsoniskā krēsla).',
    dawn:'Gaišs sāks kļūt ap {t}, saullēkts {r}.',
    how:'Loks ir Saules ceļš pa debesīm šodien: pa kreisi saullēkta laiks, pa labi saulrieta. Dzeltenais punkts rāda, kur Saule ir tagad. Apakšā — cik atlicis līdz saulrietam, bet naktī — līdz saullēktam.',
    tip:'Latvijā diena ilgst no nepilnām 7 stundām decembrī līdz gandrīz 18 stundām jūnijā. Zelta stunda un skaista saulrieta prognoze — kartē «Padomi šodienai».'
  }
}});
Object.assign(I18N.en, {gi:{
  open:'Explain', close:'Close', how:'How to read it', scale:'Scale', now:'Now',
  wind:{
    ico:'💨', head:'{v} m/s · {n}',
    lv:[['0–1.5','calm, light air','smoke rises almost vertically'],['1.6–3.3','light breeze','felt on the face, leaves rustle'],['3.4–5.4','gentle breeze','leaves and twigs move, flags fly'],['5.5–7.9','moderate','raises dust and paper, branches sway'],['8–10.7','fresh','small trees sway, whitecaps on water'],['10.8–13.8','strong','large branches move, umbrellas hard to hold'],['13.9–17.1','near gale','whole trees move, hard to walk into the wind'],['17.2–20.7','gale','twigs break off, dangerous near trees'],['20.8+','storm','trees fall, damage possible']],
    nowTxt:'{v} m/s is {kmh} km/h, {bf} on the Beaufort scale: {e}.',
    gust:'Gusts up to {g} m/s: short bursts lasting a few seconds. They are what breaks umbrellas and branches.',
    gustBad:'Gusts up to {g} m/s are dangerous: keep away from trees, billboards and scaffolding.',
    dir:'The wind blows {f}.',
    feel:'Because of wind and humidity it feels like {f} while the thermometer shows {t}.',
    sea:'West and south-west winds in Latvia usually bring moist Baltic air: clouds, rain, mild weather.',
    land:'East and north winds usually bring dry air: clear skies, frost in winter, cool nights.',
    south:'South winds are usually warm.',
    from:['from the north','from the north-east','from the east','from the south-east','from the south','from the south-west','from the west','from the north-west'],
    how:'The big number is the average wind speed in metres per second. The blue arrow sits on the side of the circle the wind comes from and points where it blows. “N” at the top is north. Below are the wind direction and gust strength.',
    tip:'Forecast speed is for 10 m above open ground. Between buildings the wind is usually weaker; on the coast, bridges and open fields it is stronger.'
  },
  hum:{
    ico:'💧', head:'{v}% · {n}',
    lv:[['0–30%','very dry','dry skin and lips'],['30–40%','dry','slightly dry'],['40–60%','comfortable','ideal for people'],['60–80%','humid','normal for Latvia'],['80–100%','very humid','damp, fog and drizzle possible']],
    nowTxt:'The air holds {v}% of the moisture it can hold at {t}.',
    dew:'Dew point {d}: if the air cools to this temperature, dew, fog or frost will form.',
    fog:'Only {k}° to the dew point: fog, drizzle and wet surfaces are likely.',
    raw:'Raw cold: in high humidity the chill feels stronger and clothes get damp faster.',
    muggy:'Dew point above 18°: the air is muggy, hard to exercise.',
    cloud:'☁️ {c}% — share of the sky covered by cloud: up to 20% clear, 30–60% partly cloudy, 70–90% cloudy, 100% overcast.',
    how:'The arc and number show relative humidity. It is not “how much water is in the air” but how close the air is to saturation at the current temperature. That is why humidity rises at night as it cools and falls during the day.',
    tip:'In winter, cold outdoor air becomes dry once it warms up indoors, even at 90% outside. Indoors 40–60% is comfortable.'
  },
  uv:{
    ico:'🕶️', head:'{v} · {n}',
    lv:[['0–2','low','no protection needed'],['3–5','moderate','at midday: sunglasses, hat, SPF 30'],['6–7','high','seek shade 12–16, SPF 30–50'],['8–10','very high','avoid the midday sun'],['11+','extreme','better not to go out unprotected']],
    nowTxt:'Index now {v}: {e}.',
    max:'Today’s peak is about {m}, at solar noon around {n}.',
    need:'Sun protection is needed at index 3 and above.',
    how:'The UV index shows the strength of the ultraviolet rays that cause tanning and sunburn. The higher the number, the faster you burn. It depends on sun height, clouds and ozone and peaks at midday.',
    tip:'Thin clouds let through up to 80% of UV. Water, sand and snow reflect it. In Latvia the index reaches 3+ roughly from April to September.'
  },
  air:{
    ico:'🍃', head:'{v} EAQI · {n}',
    lv:[['0–20','good','no restrictions'],['20–40','fair','no restrictions'],['40–60','moderate','sensitive people: less exertion outdoors'],['60–80','poor','everyone: reduce outdoor exertion'],['80–100','very poor','avoid outdoor exertion'],['100+','extremely poor','stay indoors if possible']],
    nowTxt:'Index {v}: {e}.',
    main:'The main contributor is {p}.',
    pol:{pm2_5:'fine particles PM2.5 (smoke, exhaust, wood heating)', pm10:'dust PM10 (roads, construction, sand)', nitrogen_dioxide:'nitrogen dioxide NO₂ (traffic)', ozone:'ozone O₃ (forms in hot sunshine)'},
    conc:'PM2.5 {a} · PM10 {b} · NO₂ {c} · O₃ {d} µg/m³',
    how:'The European Air Quality Index (EAQI) takes the worst of fine particles PM2.5 and PM10, nitrogen dioxide and ozone. Lower is better. It is a CAMS model forecast for this place, not a reading from the nearest station.',
    tip:'Pollen is not part of the index — see the “Pollen” card. On calm frosty evenings, areas with wood heating usually have worse air.'
  },
  pres:{
    ico:'🧭', head:'{v} hPa · {n}',
    lv:[['< 990','very low','deep low: wind, precipitation'],['990–1005','low','cloudy, often rain'],['1005–1020','normal','average about 1013'],['1020–1030','high','high pressure: dry, few clouds'],['> 1030','very high','clear; hard frost in winter, heat in summer']],
    nowTxt:'{v} hPa = {mm} mmHg. Pressure is {n}: {e}.',
    down:'Falling by {x} hPa in 3 hours. This usually means a low or front is coming: clouds, rain and stronger wind in the next 6–24 hours.',
    fast:'Falling fast ({x} hPa in 3 hours) — a sign of strong wind.',
    up:'Rising by {x} hPa in 3 hours: weather usually improves and the wind eases.',
    flat:'Almost unchanged: the weather will probably stay the same.',
    how:'The needle shows pressure on a scale from 960 to 1050 hPa. The middle mark is 1013 hPa, the average. The value is reduced to sea level, so an uncalibrated home barometer reads lower: about 1 hPa per 8 m of altitude.',
    tip:'The trend matters more than the number: ↗ rising, → steady, ↘ falling.'
  },
  sun:{
    ico:'🌅', head:'{a} – {b}',
    len:'Daylight {h} h {m} min; tomorrow {d}.', longer:'{n} min longer', shorter:'{n} min shorter', same:'the same',
    noon:'The sun is highest at {t}: {e}° above the horizon.',
    dusk:'After sunset it stays light until about {t} (civil twilight).',
    dawn:'It starts getting light around {t}, sunrise at {r}.',
    how:'The arc is today’s path of the sun: sunrise time on the left, sunset on the right. The yellow dot shows where the sun is now. Below is the time left until sunset, or until sunrise at night.',
    tip:'In Latvia daylight lasts from under 7 hours in December to almost 18 hours in June. Golden hour and the sunset forecast are in the “Tips for today” card.'
  }
}});

/* ---------- «Где я»: погода по местоположению ---------- */
Object.assign(I18N.ru, {
  geoHere:'Где я', geoTitle:'Погода точно для места, где вы сейчас (по GPS), с названием района',
  geoNoTitle:'Не удалось определить место', geoNo:'Этот браузер не умеет определять местоположение.',
  geoDenied:'Доступ к местоположению запрещён. Разрешите его: значок замка рядом с адресом → Разрешения → Местоположение (или в настройках приложения Laiks).',
  geoFail:'Телефон не смог определить место. Включите геолокацию и попробуйте ещё раз.',
  geoFarTitle:'Вы за пределами Латвии', geoFar:'Приложение показывает погоду только в Латвии и рядом с ней.',
  geoFoot:'Названия районов: © {osm}. Место определяется только на телефоне; в запросах уходит точка, округлённая до ~100 м.'
});
Object.assign(I18N.lv, {
  geoHere:'Kur es esmu', geoTitle:'Laikapstākļi tieši vietai, kur esat tagad (pēc GPS), ar apkaimes nosaukumu',
  geoNoTitle:'Neizdevās noteikt atrašanās vietu', geoNo:'Šis pārlūks nevar noteikt atrašanās vietu.',
  geoDenied:'Piekļuve atrašanās vietai ir liegta. Atļaujiet to: slēdzenes ikona blakus adresei → Atļaujas → Atrašanās vieta (vai Laiks lietotnes iestatījumos).',
  geoFail:'Tālrunis nevarēja noteikt vietu. Ieslēdziet ģeolokāciju un mēģiniet vēlreiz.',
  geoFarTitle:'Jūs esat ārpus Latvijas', geoFar:'Lietotne rāda laikapstākļus tikai Latvijā un tās tuvumā.',
  geoFoot:'Apkaimju nosaukumi: © {osm}. Vieta tiek noteikta tikai tālrunī; pieprasījumos tiek sūtīts punkts, noapaļots līdz ~100 m.'
});
Object.assign(I18N.en, {
  geoHere:'Where I am', geoTitle:'Weather for exactly where you are now (GPS), with the neighbourhood name',
  geoNoTitle:'Could not get your location', geoNo:'This browser cannot determine location.',
  geoDenied:'Location access is blocked. Allow it: lock icon next to the address → Permissions → Location (or in the Laiks app settings).',
  geoFail:'The phone could not determine your location. Turn on location and try again.',
  geoFarTitle:'You are outside Latvia', geoFar:'The app only shows weather in and around Latvia.',
  geoFoot:'Neighbourhood names: © {osm}. Location is determined on your phone only; requests carry a point rounded to ~100 m.'
});
Object.assign(I18N.ru, {roadNear:'рядом'});
Object.assign(I18N.lv, {roadNear:'tuvumā'});
Object.assign(I18N.en, {roadNear:'nearby'});
