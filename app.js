'use strict';

const OFFLINE_CACHE = 'bac-orientation-2026-v1';
const SITE_FILES = ['index.html', 'styles.css', 'app.js', 'data.js'];

if (typeof document === 'undefined') {
  const siteURLs = SITE_FILES.map(file => new URL(file, self.registration.scope).href);
  const [homeURL] = siteURLs;
  self.addEventListener('install', event => {
    event.waitUntil(caches.open(OFFLINE_CACHE).then(cache => cache.addAll(siteURLs.map(url => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting()));
  });
  self.addEventListener('activate', event => {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('bac-orientation-') && key !== OFFLINE_CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
  });
  self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    const scope = new URL(self.registration.scope);
    const navigation = event.request.mode === 'navigate' && url.origin === scope.origin && (url.pathname === new URL(homeURL).pathname || url.pathname === scope.pathname);
    const cacheURL = navigation ? homeURL : siteURLs.find(asset => asset === url.href);
    if (!cacheURL) return;
    event.respondWith(fetch(event.request).catch(() => caches.open(OFFLINE_CACHE).then(cache => cache.match(cacheURL))));
  });
} else {
  startApp();
}

function startApp() {
  const wilayas = [
    ['Adrar', 'أدرار'], ['Chlef', 'الشلف'], ['Laghouat', 'الأغواط', 'Aflou'], ['Oum El Bouaghi', 'أم البواقي'],
    ['Batna', 'باتنة', 'Barika'], ['Bejaia', 'بجاية'], ['Biskra', 'بسكرة'], ['Bechar', 'بشار'],
    ['Blida', 'البليدة'], ['Bouira', 'البويرة'], ['Tamanrasset', 'تمنراست', 'Tamanghasset'], ['Tebessa', 'تبسة'],
    ['Tlemcen', 'تلمسان', 'Maghnia'], ['Tiaret', 'تيارت', 'Sougueur', 'Ksar Chellala'], ['Tizi Ouzou', 'تيزي وزو'],
    ['Alger', 'الجزائر', 'Algiers', 'Kouba', 'Bouzaréah', 'Bab Ezzouar', 'Ben Aknoun', 'El Kharrouba', 'Bordj El Kiffan', 'USTHB'],
    ['Djelfa', 'الجلفة'], ['Jijel', 'جيجل'], ['Setif', 'سطيف'], ['Saida', 'سعيدة'], ['Skikda', 'سكيكدة'],
    ['Sidi Bel Abbes', 'سيدي بلعباس'], ['Annaba', 'عنابة'], ['Guelma', 'قالمة'], ['Constantine', 'قسنطينة'],
    ['Medea', 'المدية'], ['Mostaganem', 'مستغانم'], ['M Sila', 'المسيلة', 'Msila', 'Bou Saada'], ['Mascara', 'معسكر'],
    ['Ouargla', 'ورقلة'], ['Oran', 'وهران'], ['El Bayadh', 'البيض', 'Elbayadh'], ['Illizi', 'إليزي'],
    ['Bordj Bou Arreridj', 'برج بوعريريج', 'Bord Bou Arreridj'], ['Boumerdes', 'بومرداس'], ['El Tarf', 'الطارف', 'Eltarf'],
    ['Tindouf', 'تندوف'], ['Tissemsilt', 'تيسمسيلت'], ['El Oued', 'الوادي', 'Eloued'], ['Khenchela', 'خنشلة'],
    ['Souk Ahras', 'سوق أهراس'], ['Tipaza', 'تيبازة', 'Tipasa', 'Kolea'], ['Mila', 'ميلة'], ['Ain Defla', 'عين الدفلى', 'Khemis Miliana'],
    ['Naama', 'النعامة'], ['Ain Temouchent', 'عين تموشنت'], ['Ghardaia', 'غرداية'], ['Relizane', 'غليزان'],
    ['Timimoun', 'تيميمون'], ['Bordj Badji Mokhtar', 'برج باجي مختار'], ['Ouled Djellal', 'أولاد جلال'],
    ['Beni Abbes', 'بني عباس'], ['In Salah', 'عين صالح', 'Ain Salah'], ['In Guezzam', 'عين قزام', 'Ain Guezzam'],
    ['Touggourt', 'تقرت'], ['Djanet', 'جانت'], ['El Meghaier', 'المغير', 'El M Ghair'], ['El Meniaa', 'المنيعة', 'El Menia']
  ].map(([name, label, ...aliases], index) => ({ id: String(index + 1), name, label, aliases: [name, ...aliases] }));

  const national = { id: 'national', label: 'مؤسسات وطنية', name: 'Recrutement national' };
  const unknown = { id: 'unknown', label: 'غير محدد', name: '' };
  const locations = [national, ...wilayas, unknown];
  const locationRank = new Map(locations.map((location, index) => [location.id, index]));
  const locationPatterns = wilayas.flatMap(location => location.aliases.map(alias => ({ key: normalize(alias), location }))).sort((first, second) => second.key.length - first.key.length);

  const profiles = [
    [/PROTHESISTES DENTAIRES/, 'تعويضات الأسنان', 'يتناول تصميم وتصنيع التعويضات السنية وفق وصفة طبيب الأسنان، باستخدام مواد وأدوات مخبرية وتقنيات رقمية بحسب التكوين.', ['مختبرات تعويضات الأسنان', 'التصميم والتصنيع الرقمي للتعويضات']],
    [/SANTE ET HYGIENE DENTAIRE/, 'صحة الفم والأسنان', 'يركز على الوقاية والتثقيف الصحي والعناية بصحة الفم ضمن فريق الرعاية السنية.', ['مصالح صحة الفم', 'برامج الوقاية والتثقيف الصحي']],
    [/MEDECINE DENTAIRE/, 'طب الأسنان', 'يدرس تشخيص أمراض الأسنان واللثة وعلاجها والوقاية منها، مع تدريب سريري تدريجي في رعاية المرضى.', ['عيادات طب الأسنان', 'مصالح صحة الفم بالمستشفيات', 'التخصص والبحث بعد متابعة الدراسة']],
    [/^MEDECINE\b/, 'الطب', 'يجمع تكوين الطب بين علوم الجسم والأمراض، ثم التدريب السريري وفحص المرضى. تتيح الدراسة اللاحقة التخصص في أحد فروع الطب.', ['المستشفيات والمؤسسات الصحية', 'الطب العام أو التخصص بعد استيفاء الشروط', 'البحث السريري']],
    [/PHARMACIE/, 'الصيدلة', 'يتناول الأدوية وتركيبها وجودتها واستعمالها. تختلف مسؤوليات خريج الصيدلة عن مسؤوليات المحضّر أو المساعد، لذا تحقّق من نوع الشهادة في هذا المسار.', ['الصيدليات ومصالح الصيدلة الاستشفائية', 'صناعة الأدوية ومراقبة الجودة', 'مختبرات البحث']],
    [/VETERINAIRES/, 'الطب البيطري', 'يدرس صحة الحيوان والتشخيص والوقاية، إضافة إلى الصحة العامة وسلامة المنتجات الحيوانية.', ['العيادات والمصالح البيطرية', 'متابعة صحة قطعان التربية', 'مراقبة السلامة الغذائية']],
    [/SAGE FEMME/, 'القبالة', 'يتناول متابعة الحمل والولادة ورعاية الأم والمولود والتثقيف الصحي، مع تدريب ميداني في مرافق الولادة.', ['أقسام الولادة', 'مراكز صحة الأم والطفل']],
    [/INF[I]?MIERS|INFIRMIERS/, 'التمريض', 'يركز على رعاية المرضى، متابعة العلامات الحيوية، تطبيق خطط العناية والتوثيق والعمل ضمن الفريق الصحي.', ['الأقسام الاستشفائية', 'مؤسسات الصحة الجوارية والرعاية']],
    [/IMAGERIE MEDICALE|LABORANTINS|ANESTHESIE/, 'التقنيات الصحية', 'تدريب تطبيقي في الإجراءات التقنية وسلامة المرضى. يحدد اسم المسار مكان التدريب: التصوير الطبي أو التحاليل المخبرية أو المساعدة في التخدير.', ['أقسام التصوير الطبي لمسار التصوير', 'المختبرات أو غرف العمليات بحسب التخصص']],
    [/KINESITHERAPEUTES|ERGOTHERAPEUTES|PSYCHOMOTRIC|APPAREILLEURS|PODOLOGUE/, 'التأهيل الصحي', 'يدرس تقييم القدرات الوظيفية ودعم الحركة أو الاستقلال في الأنشطة اليومية. تختلف الوسائل السريرية والتقنية باختلاف التأهيل الحركي أو الوظيفي أو صناعة الأجهزة.', ['مراكز التأهيل', 'مصالح العلاج الوظيفي أو الطبيعي', 'وحدات الأجهزة التقويمية للمسارات التقنية']],
    [/DIETETICIENS/, 'التغذية العلاجية', 'يدرس تقييم الاحتياجات الغذائية وتخطيط الوجبات والتثقيف الغذائي ضمن فرق الرعاية.', ['مصالح التغذية بالمستشفيات', 'التثقيف الغذائي والصحة العامة']],
    [/CYBER SECURITE/, 'الأمن السيبراني', 'يدرس أمن الشبكات والأنظمة والبرمجيات، مع مهارات إدارة المخاطر والحماية والاستجابة للحوادث.', ['أمن الأنظمة والشبكات', 'الاستجابة للحوادث', 'التدقيق وإدارة المخاطر']],
    [/INTELLIGENCE ARTIFICIELLE|STATISTIQUE.*DONNEES|SCIENCE DES DONNEES/, 'الذكاء الاصطناعي وعلوم البيانات', 'يجمع البرمجة والرياضيات والإحصاء لتنظيم البيانات وبناء النماذج وتقييمها؛ وقد يطبّق ذلك في الاقتصاد أو الإلكترونيات بحسب المسار.', ['تحليل البيانات', 'هندسة البيانات وتطوير النماذج', 'البحث والتطوير']],
    [/^MATHEMATIQUES|^FB MATHS/, 'الرياضيات', 'يدرس التحليل والجبر والاحتمالات، وقد يضيف الإحصاء والحوسبة والنمذجة بحسب المسار.', ['النمذجة والتحليل الكمي', 'الإحصاء وتحليل البيانات مع مهارات إضافية', 'البحث أو التدريس بعد استيفاء الشروط']],
    [/INFORMATIQUE|^FB INF|SYSTEMES D INFORMATION/, 'الإعلام الآلي', 'يدرس الخوارزميات والبرمجة وقواعد البيانات وبناء الأنظمة. تعتمد المواد التطبيقية على مسار المؤسسة والتخصصات المرافقة.', ['تطوير البرمجيات', 'إدارة الأنظمة وقواعد البيانات', 'اختبار البرمجيات وتحليل البيانات']],
    [/ARCHITECTURE|URBANISME|TECHNIQUES URBAINES|METIERS DE LA VILLE/, 'العمارة والتهيئة العمرانية', 'يجمع تصميم المباني أو التخطيط الحضري مع الرسم التقني ودراسة الموقع. تعطي مسارات المهن الحضرية وزنًا أكبر للتطبيق حسب التخصص.', ['مكاتب التصميم والدراسات', 'التخطيط الحضري وإدارة المشاريع', 'التصميم الداخلي أو المسح للمسارات المعنية']],
    [/GENIE CIVIL|TRAVAUX PUBLICS|CONSTRUCTION/, 'الهندسة المدنية', 'يدرس المنشآت والمواد والتربة وطرق الإنجاز. تتخصص بعض المسارات في الطرق أو الشبكات أو إدارة مشاريع البناء.', ['مكاتب الدراسات الإنشائية', 'شركات البناء والأشغال العمومية', 'متابعة الورشات ومراقبة الجودة']],
    [/HYDRAULIQUE/, 'الهندسة المائية', 'يدرس حركة المياه وتصميم شبكات التوزيع والصرف والمنشآت المائية، مع تطبيقات في إدارة الموارد.', ['مكاتب الدراسات المائية', 'مؤسسات المياه والتطهير', 'متابعة المنشآت والشبكات']],
    [/GENIE ?BIOMEDICAL/, 'الهندسة الطبية الحيوية', 'يدرس مبادئ تشغيل وقياس وصيانة الأجهزة المستخدمة في التشخيص والعلاج، مع مراعاة السلامة والمعايير التقنية.', ['إدارة التجهيزات الطبية', 'صيانة ومعايرة الأجهزة', 'الدعم التقني لموردي المعدات الصحية']],
    [/GENIE ?MECANIQUE|ELECTROMECANIQUE|AERONAUTIQUE|GENIE MARITIME|OPTIQUE ET MECANIQUE/, 'الميكانيك والأنظمة الصناعية', 'يدرس حركة الآلات وتصميمها وموادها والتحكم في أدائها. تتخصص بعض البرامج في السيارات أو الطيران أو الملاحة أو القياس الدقيق.', ['التصميم والمكاتب التقنية', 'الصيانة الصناعية', 'اختبار المعدات ومراقبة الجودة']],
    [/ENERGIES RENOUVELABLES|ELECTROTECHNIQUE|GENIE ELECTRIQUE|ENERGETIQUE/, 'الكهرباء والطاقة', 'يدرس تحويل الطاقة وتوزيعها والآلات الكهربائية. قد يتخصص البرنامج في الطاقة الشمسية أو التحويل الحراري أو تشغيل الشبكات.', ['مؤسسات إنتاج وتوزيع الكهرباء', 'تركيب وصيانة الأنظمة الكهربائية', 'مشاريع الطاقة المتجددة']],
    [/AUTOMATIQUE|ELECTRONI|TELECOMMUNICATION|COMMUNICATIONS FILAIRES|SYSTEMES AUTONOMES|TECHNOLOGIES.*COMMUNICATION/, 'الإلكترونيات والتحكم والاتصالات', 'يتناول الدارات والإشارات أو التحكم الآلي أو شبكات الاتصال تبعًا للبرنامج، مع تطبيقات في الأجهزة والأنظمة المدمجة.', ['التحكم الصناعي والأنظمة المدمجة', 'هندسة شبكات الاتصالات', 'اختبار وصيانة المعدات']],
    [/GENIE DES PROCEDES|PETROCHIMI|HYDROCARBURES|METALLURGIE|GENIE MINIER/, 'هندسة العمليات والموارد', 'يركز على تحويل المواد وتشغيل المعدات ومراقبة العمليات والسلامة. يحدد المسار مجال التطبيق من المصانع إلى المناجم والطاقة.', ['تشغيل وحدات الإنتاج والتحويل', 'مراقبة العمليات والجودة', 'الطاقة أو التعدين وفق التخصص']],
    [/GENIE INDUSTRIEL|HYGIENE ET SECURITE|INGENIERIE DES TRANSPORTS/, 'الهندسة الصناعية', 'يعالج تنظيم عمليات الإنتاج أو النقل وتحليل الأداء والسلامة، مع تطبيقات في التخطيط والصيانة والتحسين.', ['إدارة الإنتاج والعمليات', 'الجودة والسلامة الصناعية', 'التخطيط اللوجستي لمسارات النقل']],
    [/SCIENCES ALIMENTAIRES|AGROALIMENTAIRES|SCIENCES DE L ALIMENT/, 'علوم الأغذية', 'يدرس تركيب الأغذية وتصنيعها وحفظها وسلامتها، وقد يتخصص في إدارة الجودة بالمصانع.', ['الصناعات الغذائية', 'مخابر التحاليل ومراقبة الجودة', 'تطوير المنتجات الغذائية']],
    [/AGRONOMI|AGRICULTURE|FORETS/, 'العلوم الزراعية', 'يدرس التربة والإنتاج النباتي والحيواني وإدارة الموارد. تهتم المسارات الصحراوية أو الغابية بخصائص البيئة المحلية.', ['الإنتاج الزراعي والإرشاد', 'إدارة المياه والتربة', 'دراسات الغابات والموارد بحسب المسار']],
    [/ECOLOGIE|HYDROBIOLOGIE|SCIENCES DE LA MER|AMENAGEMENT DU LITTORAL/, 'البيئة والموارد المائية', 'يدرس علاقة الكائنات ببيئاتها وأساليب الرصد وتقييم أثر الأنشطة البشرية على النظم البرية أو المائية.', ['مكاتب الدراسات البيئية', 'رصد النظم المائية أو البرية', 'البحث وحماية الموارد الطبيعية']],
    [/BIOTECHNOLOGIE|BIOLOGIQUES|NATURE ET DE LA VIE/, 'علوم الطبيعة والحياة', 'يدرس الخلايا والكائنات ووظائفها بالعمل المخبري والميداني. تتفرع منه تخصصات مثل الأحياء الدقيقة والبيوتكنولوجيا والبيئة.', ['المختبرات والبحث العلمي', 'مراقبة الجودة في صناعات الأغذية والأدوية', 'الدراسات البيئية بحسب التخصص']],
    [/CHIMIE|PHYSIQUE|SCIENCES DE LA MATIERE|NANOSCIENCES/, 'علوم المادة', 'يدرس بنية المادة وخصائصها وطرق القياس والتجريب. تركز فروع الكيمياء على التفاعلات والتحليل، وتركز الفيزياء على النمذجة والقياس.', ['مختبرات التحليل والقياس', 'مراقبة جودة المواد', 'البحث بعد متابعة الدراسة']],
    [/GEOLOGIE|GEOPHYSIQUE|GEOGRAPHIE|AMENAGEMENT DU TERRITOIRE/, 'علوم الأرض والتهيئة', 'يدرس الظواهر الأرضية أو توزيع الأنشطة والموارد على الخرائط. تشمل الأدوات العمل الميداني أو نظم المعلومات الجغرافية حسب البرنامج.', ['الدراسات الجيوتقنية والموارد', 'الخرائط ونظم المعلومات الجغرافية', 'التهيئة الإقليمية']],
    [/^DROIT\b/, 'القانون', 'يدرس النصوص القانونية وكيفية تفسيرها وتطبيقها، من القانون العام إلى العقود والقانون التجاري بحسب التخصص.', ['الشؤون القانونية والامتثال', 'الإدارات والمؤسسات والشركات', 'المهن القضائية وفق شروط الالتحاق بها']],
    [/POLITIQUES|POLITIQUE/, 'العلوم السياسية', 'يدرس المؤسسات والسياسات العامة والعلاقات الدولية وطرق تحليل القرارات والبرامج العامة.', ['دراسات السياسات العامة', 'الإدارة والاتصال المؤسسي', 'البحث ومراكز الدراسات']],
    [/FINANCIER|COMPTABILITE|FINANCE|FINTECH/, 'المالية والمحاسبة', 'يدرس قراءة القوائم المالية، المحاسبة، المخاطر وتحليل الاستثمار. تختلف مهام الخريج حسب مسار المحاسبة أو الأسواق أو التقنية المالية.', ['المحاسبة والرقابة المالية', 'البنوك والتأمين', 'التدقيق والتحليل المالي']],
    [/TRADUCTION|INTERPRETARIAT/, 'الترجمة والترجمة الشفوية', 'يدرس نقل المعنى بين اللغات المحددة في البرنامج، مع تدريب على المصطلحات والتحرير أو الترجمة الشفوية.', ['الترجمة والتحرير متعدد اللغات', 'التوطين اللغوي', 'الترجمة التخصصية بعد اكتساب الخبرة']],
    [/^LANGUE|^ANGLAIS|^ARABE|^FRANCAIS/, 'اللغات والآداب', 'ينمّي مهارات القراءة والكتابة والتحليل اللغوي والأدبي. تُحدد لغة الدراسة والمسارات التطبيقية في وصف البرنامج.', ['التحرير والنشر والمحتوى', 'التواصل متعدد اللغات', 'التدريس وفق شروطه']],
    [/INFORMATION ET|COMMUNICATION|RELATIONS PUBLIQUES/, 'الإعلام والاتصال', 'يدرس إنتاج الرسائل الإعلامية وتحليل الجمهور وأساليب الاتصال المؤسسي والرقمي، مع تطبيقات تختلف بحسب القطاع المذكور.', ['الإعلام وإنتاج المحتوى', 'العلاقات العامة والاتصال المؤسسي', 'إدارة قنوات التواصل الرقمي']],
    [/ECONOMI|GESTION|MANAGEMENT|COMMERCI/, 'الاقتصاد والتسيير والتجارة', 'يتناول عمل الأسواق والمؤسسات والتخطيط واتخاذ القرارات، مع مواد في الإحصاء والمحاسبة أو التسويق بحسب المسار.', ['تحليل الأعمال والدراسات الاقتصادية', 'التسيير والتسويق والمبيعات', 'العمليات الإدارية أو التجارية']],
    [/ARCHEOLOGIE|CONSERVATION ET RESTAURATION/, 'الآثار والتراث', 'يدرس توثيق التراث المادي أو تحليله وصونه، بحسب ما إذا كان المسار في الآثار أو الترميم.', ['المتاحف ومؤسسات التراث', 'التوثيق والعمل الميداني', 'الحفظ والترميم للمسارات المؤهلة']],
    [/BIBLIOTHECONOMIE/, 'علم المكتبات', 'يدرس تنظيم الموارد وتصنيفها وأرشفتها وإتاحتها للباحثين والجمهور.', ['المكتبات', 'مراكز الوثائق والأرشيف', 'إدارة المجموعات الرقمية']],
    [/SOCIOLOGIE|PSYCHOLOGIE|SCIENCES SOCIALES|ASSISTANTS SOCIAUX/, 'العلوم الاجتماعية', 'يدرس السلوك والمجتمع وأساليب البحث الميداني. تختلف المخرجات بين علم النفس وعلم الاجتماع والعمل الاجتماعي.', ['البحوث الاجتماعية', 'المشاريع الاجتماعية والثقافية', 'الإرشاد أو العمل الاجتماعي بحسب المؤهل']],
    [/SCIENCES ISLAMIQUES/, 'العلوم الإسلامية', 'يدرس النصوص والفِكر الإسلامي وأدوات البحث فيها. تختلف محاور الفقه واللغة والتاريخ باختلاف البرنامج.', ['البحث والتحرير المتخصص', 'العمل الثقافي والتربوي', 'التدريس وفق شروطه']],
    [/SPORTI|ENTRAINEMENT/, 'علوم الرياضة', 'يدرس الحركة وفسيولوجيا الجهد وأساليب التدريب وتنظيم النشاط البدني، وقد يضيف تخصصًا تربويًا أو صحيًا.', ['التدريب في الأندية', 'تسيير النشاط الرياضي', 'الإعداد البدني أو التدريس بحسب المؤهل']],
    [/CINEMA|AUDIOVISUEL|SPECTACLE|SCENARIO|CONTENU NUMERIQUE|EFFETS SPECIAUX|COMEDIEN/, 'السينما والفنون الأدائية والرقمية', 'يعتمد على المشاريع التطبيقية في السرد أو الأداء أو الصورة والصوت. ركّز على ملف الأعمال والتدريب المناسب للمسار.', ['الإنتاج الإعلامي والسينمائي', 'المونتاج أو تصميم المؤثرات بحسب البرنامج', 'العمل المسرحي والثقافي']],
    [/MUSIQUE|MUSICIEN/, 'الموسيقى', 'يدرس الأداء أو التأليف أو التحليل الموسيقي، بحسب عنوان البرنامج، مع تركيز عملي على الاستماع والتمرين.', ['الأداء والإنتاج الموسيقي', 'المؤسسات الثقافية', 'التعليم الفني وفق شروطه']],
    [/^ARTS\b|DESIGN|DESSIN/, 'الفنون البصرية', 'يطوّر مهارات التكوين البصري والإنتاج الفني، مع أعمال تطبيقية في الرسم أو النحت أو التصميم حسب المسار.', ['التصميم البصري', 'المعارض والمشاريع الثقافية', 'العمل الفني المستقل']]
  ];

  const families = {
    A: ['العلوم والتكنولوجيا', 'تكوين في الرياضيات والفيزياء والأدوات التقنية يمهد لدراسة أحد فروع الهندسة أو التقنية. المواد والتخصصات اللاحقة تختلف حسب المؤسسة.', ['الدراسات التقنية', 'الإنتاج والصيانة الصناعية', 'متابعة الدراسة الهندسية']],
    E: ['علوم الأرض والمجال', 'يدرس خصائص الأرض أو طرق تحليل المجال والموارد حسب التخصص.', ['الدراسات الميدانية', 'الخرائط والتهيئة', 'المؤسسات البحثية']],
    I: ['العلوم الإنسانية', 'يدرس الإنسان وتاريخه وثقافته، مع أدوات للتحليل والنقد والبحث والتوثيق.', ['البحث والتوثيق', 'المؤسسات الثقافية', 'المشاريع التربوية والإعلامية بحسب المسار']],
    N: ['العمران والتراث', 'يتناول البيئة المبنية والمدينة أو إدارة أصولها الفنية والثقافية. راجع موقع المؤسسة للتأكد من مجال التكوين.', ['الدراسات الحضرية', 'المكاتب التقنية', 'مؤسسات الثقافة والتهيئة']],
    W: ['الصحة العمومية', 'تكوين تطبيقي في مهن الرعاية ضمن مؤسسات الصحة بحسب التخصص.', ['مؤسسات الصحة العمومية', 'مراكز الرعاية المتخصصة']],
    X: ['الصحة العمومية', 'تكوين تطبيقي في الخدمات المساندة للرعاية الصحية. يحدد التخصص نوع التدريب والمسؤوليات ومجال الممارسة.', ['المستشفيات ومرافق الصحة الجوارية', 'الوحدات التقنية أو خدمات دعم المرضى بحسب التخصص']],
    Z: ['الصحة العمومية', 'تكوين تطبيقي في مهن الرعاية ضمن مؤسسات الصحة بحسب التخصص.', ['مؤسسات الصحة العمومية', 'الأقسام التقنية بحسب التكوين']]
  };

  const teaching = [
    [/\bP E P\b|ENSEIGNEMENT PRIMAIRE/, 'التعليم الابتدائي', 'مسار تكوين أساتذة التعليم الابتدائي يجمع المادة المدرّسة وطرائق تدريسها والتدريب الميداني.', ['التعليم الابتدائي وفق شروط التوظيف', 'إعداد الأنشطة والمواد التربوية']],
    [/\bP E M\b|ENSEIGNEMENT MOYEN/, 'التعليم المتوسط', 'مسار تكوين أساتذة التعليم المتوسط يجمع المادة المدرّسة وطرائق تدريسها والتدريب الميداني.', ['التعليم المتوسط وفق شروط التوظيف', 'الأنشطة والدعم التربوي']],
    [/\bP E S\b|ENSEIGNEMENT SECONDAIRE/, 'التعليم الثانوي', 'مسار تكوين أساتذة التعليم الثانوي يجمع الإعداد في مادة التخصص وطرائق تدريسها والتدريب الميداني.', ['التعليم الثانوي وفق شروط التوظيف', 'تطوير المواد والأنشطة التعليمية']]
  ];

  const priorityNames = ['الأولوية الأولى', 'الأولوية الثانية', 'الأولوية الثالثة', 'الأولوية الرابعة'];
  const pageSize = 30;
  const byId = id => document.getElementById(id);
  const form = byId('filters');
  const query = byId('query');
  const wilaya = byId('wilaya');
  const school = byId('school');
  const score = byId('score');
  const priority = byId('priority');
  const sort = byId('sort');
  const cards = byId('cards');
  const favoriteCards = byId('favorite-cards');
  const dialog = byId('major-dialog');
  const print = byId('print');
  const share = byId('share');
  const numberFormat = new Intl.NumberFormat('en-DZ');
  const views = ['discover', 'about', 'favorites'];
  const hashLinks = [...document.querySelectorAll('a[href^="#"]')].filter(link => link.hash !== '#main').map(link => [link, link.hash.slice(1)]);
  let rows = null;
  let schools = [];
  let visibleRows = [];
  let pageEnd = 0;
  let activeView = 'discover';
  let favorites = new Set();
  let pendingSearch;

  function normalize(value) {
    return String(value ?? '').normalize('NFKD').replace(/\p{M}/gu, '').replace(/ـ/g, '').replace(/ى/g, 'ي').replace(/ة/g, 'ه').toUpperCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  function icon(name) {
    return `<svg class="icon" data-lucide="${name}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  }

  function refreshIcons() {
    if (!window.lucide?.createIcons) return;
    window.lucide.createIcons();
    document.querySelectorAll('svg[data-lucide]').forEach(item => item.removeAttribute('data-lucide'));
  }

  function locationFor(name) {
    const campus = normalize(name.split('(')[0]);
    if (/^(RECRUTEMENT NATIONAL|ECOLE NAT(?:IONALE)?\b|E N S DES\b|INSTITUT NATIONAL\b)/.test(campus)) return national;
    const fullName = ` ${normalize(name)} `;
    const localName = /\(\s*ECOLE NORMALE SUPERIEURE\b/.test(name) ? ` ${campus} ` : fullName;
    const match = locationPatterns.find(({ key }) => ` ${campus} `.includes(` ${key} `)) ?? locationPatterns.find(({ key }) => localName.includes(` ${key} `));
    return match?.location ?? unknown;
  }

  function profileFor(row) {
    const major = normalize(row.filiere);
    const match = teaching.find(([pattern]) => pattern.test(major)) ?? profiles.find(([pattern]) => pattern.test(major));
    return match?.slice(1) ?? families[row.code_filiere[0]] ?? ['التكوين الجامعي', 'يبين عنوان المسار مجال التكوين. راجع وصف البرنامج لدى المؤسسة لمعرفة الوحدات الدراسية والشهادة والتدريب المتاح.', ['تعتمد الآفاق على وحدات التخصص والشهادة والتدريب. تحقق من المؤهلات المطلوبة لكل مهنة.']];
  }

  function option(label, value, direction) {
    const element = new Option(label, value);
    if (direction) { element.dir = direction; element.lang = 'fr'; }
    return element;
  }

  function parseHash() {
    const [rawPage, params = ''] = location.hash.slice(1).split('?');
    const page = [...views, 'explore'].includes(rawPage) ? rawPage : 'discover';
    const ids = (new URLSearchParams(params).get('ids') ?? '').split(',').filter(id => /^[0-9a-z]{1,4}$/.test(id));
    return { page, ids: rows ? ids.filter(id => rows[parseInt(id, 36)]?.id === id) : ids };
  }

  function routeHash(page) {
    return `#${page}${favorites.size ? `?ids=${[...favorites].join(',')}` : ''}`;
  }

  function updateFavoriteLinks() {
    byId('favorite-count').textContent = favorites.size;
    hashLinks.forEach(([link, destination]) => { link.setAttribute('href', routeHash(destination)); });
  }

  function syncRoute(scroll = true) {
    const { page, ids } = parseHash();
    const changedFavorites = [...favorites].join(',') !== ids.join(',');
    favorites = new Set(ids);
    updateFavoriteLinks();
    activeView = page === 'explore' ? 'discover' : page;
    views.forEach(view => { byId(`${view}-view`).hidden = view !== activeView; });
    document.querySelectorAll('[data-nav]').forEach(link => {
      if (link.dataset.nav === page) link.setAttribute('aria-current', page === 'explore' ? 'location' : 'page');
      else link.removeAttribute('aria-current');
    });
    if (changedFavorites) cards.querySelectorAll('[data-save]').forEach(button => updateSaveButton(button, favorites.has(button.dataset.save)));
    if (activeView === 'favorites') renderFavorites();
    if (page === 'explore') {
      byId('explore').scrollIntoView({ behavior: 'instant' });
      if (scroll) query.focus({ preventScroll: true });
    } else if (scroll) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      if (activeView !== 'discover') byId(`${activeView}-heading`).focus({ preventScroll: true });
    }
  }

  function numeric(value) {
    if (value === null || value === undefined || value === '' || !/^\d+(?:\.\d+)?$/.test(String(value))) return null;
    const parsed = Number(value);
    return parsed >= 0 && parsed <= 20 ? parsed : null;
  }

  function studentScore() {
    const canonical = score.value.trim().replace(/[٠-٩]/g, char => String(char.charCodeAt(0) - 0x660)).replace(/[۰-۹]/g, char => String(char.charCodeAt(0) - 0x6f0)).replace(/[٫,]/g, '.');
    const value = numeric(canonical);
    const invalid = canonical !== '' && value === null;
    byId('score-error').hidden = !invalid;
    score.setAttribute('aria-invalid', String(invalid));
    return { value, invalid };
  }

  function priorityList(row) {
    const current = Number(priority.value) - 1;
    return `<dl class="priority-list">${row.mins.map((entry, index) => {
      if (index === 3 && !row.mins[3]) return '';
      const status = entry === 'NC' ? 'nc' : numeric(entry) === null ? 'na' : '';
      const note = entry === 'NC' ? ' title="لم يُحسب المعدل"' : entry === '--' ? ' title="لم يُوجّه أي طالب"' : !entry ? ' title="لم ترد قيمة في الملف"' : '';
      return `<div${current === index ? ' class="selected"' : ''}><dt>${priorityNames[index]}</dt><dd><bdi class="${status}"${note}>${escapeHTML(entry === '' || entry == null ? '—' : entry)}</bdi></dd></div>`;
    }).join('')}</dl>`;
  }

  function chanceBadge(row, value) {
    if (value === null) return '';
    const entry = row.mins[Number(priority.value) - 1];
    const cutoff = numeric(entry);
    if (cutoff === null) return entry === 'NC' ? '<span class="chance neutral"><bdi class="number">NC</bdi> · لم يُحسب المعدل</span>' : '<span class="chance neutral">لا تتوفر مقارنة</span>';
    const delta = Math.round((value - cutoff) * 100) / 100;
    if (delta >= 0.5) return '<span class="chance high">أعلى من الحد</span>';
    if (delta > -0.5) return '<span class="chance borderline">قريب من الحد</span>';
    return '<span class="chance low">أدنى من الحد</span>';
  }

  function saveLabel(saved) {
    return saved ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة';
  }

  function updateSaveButton(button, saved) {
    button.setAttribute('aria-pressed', String(saved));
    button.setAttribute('aria-label', saveLabel(saved));
    button.title = saveLabel(saved);
  }

  function card(row, value) {
    const saved = favorites.has(row.id);
    const label = saveLabel(saved);
    return `<article class="program-card">
      <div class="card-top"><div class="card-meta"><span class="location-tag">${icon('map-pin')}${row.location.label}</span><bdi class="code-tag">${escapeHTML(row.code_filiere)}</bdi></div><button class="icon-button" type="button" data-save="${row.id}" aria-label="${label}" aria-pressed="${saved}" title="${label}">${icon('bookmark')}</button></div>
      <h3 class="program-name" lang="fr" dir="ltr">${escapeHTML(row.filiere)}</h3>
      <p class="program-school" lang="fr" dir="ltr">${escapeHTML(row.etablissement)}</p>
      ${row.precision ? `<p class="program-precision" lang="fr" dir="ltr">${escapeHTML(row.precision)}</p>` : ''}
      ${priorityList(row)}
      <div class="card-footer"><button class="text-button" type="button" data-detail="${row.id}" aria-label="تفاصيل ${escapeHTML(row.filiere)}">عن التخصص ${icon('arrow-left')}</button>${chanceBadge(row, value)}</div>
    </article>`;
  }

  function emptyState(glyph, title, message) {
    return `<div class="empty-state">${icon(glyph)}<h3>${title}</h3><p>${message}</p></div>`;
  }

  function refreshSchools() {
    const selected = school.value;
    const available = wilaya.value ? schools.filter(item => item.location.id === wilaya.value) : schools;
    school.replaceChildren(option('كل المؤسسات', ''), ...available.map(item => option(item.etablissement, item.schoolKey, 'ltr')));
    school.value = available.some(item => item.schoolKey === selected) ? selected : '';
    school.disabled = !available.length;
  }

  function updateCount() {
    const count = visibleRows.length;
    byId('result-count').textContent = count ? `عرض ${numberFormat.format(Math.min(pageEnd, count))} من ${numberFormat.format(count)} سجل قبول` : 'لا توجد نتائج مطابقة';
    byId('more-wrap').hidden = pageEnd >= count;
  }

  function renderResults() {
    if (!rows) return;
    const terms = normalize(query.value).split(' ').filter(Boolean);
    const { value } = studentScore();
    const field = Number(priority.value) - 1;
    const currentSort = sort.value;
    visibleRows = rows.filter(row => (!wilaya.value || row.location.id === wilaya.value) && (!school.value || row.schoolKey === school.value) && terms.every(term => row.search.includes(term)));
    if (currentSort === 'wilaya') visibleRows.sort((first, second) => locationRank.get(first.location.id) - locationRank.get(second.location.id));
    if (currentSort === 'low' || currentSort === 'high') {
      const multiplier = currentSort === 'low' ? 1 : -1;
      visibleRows.sort((first, second) => {
        const left = numeric(first.mins[field]);
        const right = numeric(second.mins[field]);
        if (left === null || right === null) return left === right ? 0 : left === null ? 1 : -1;
        return multiplier * (left - right);
      });
    }
    pageEnd = pageSize;
    byId('comparison-note').hidden = value === null;
    cards.innerHTML = visibleRows.length ? visibleRows.slice(0, pageEnd).map(row => card(row, value)).join('') : emptyState('search', 'جرّب توسيع البحث', 'غيّر عبارة البحث أو أزل أحد الفلاتر لعرض خيارات أكثر.');
    updateCount();
    refreshIcons();
  }

  function renderFavorites() {
    const savedRows = rows ? [...favorites].map(id => rows[parseInt(id, 36)]).filter(Boolean) : [];
    const { value } = studentScore();
    print.disabled = share.disabled = !savedRows.length;
    const empty = rows ? emptyState('bookmark', 'لا توجد تخصصات محفوظة بعد', 'اضغط على رمز الحفظ في أي بطاقة لإضافتها إلى هذه القائمة.') : emptyState('book-open', 'بيانات القبول غير جاهزة', 'تظهر القائمة عند تحميل بيانات القبول.');
    favoriteCards.innerHTML = savedRows.length ? savedRows.map(row => card(row, value)).join('') : empty;
    refreshIcons();
  }

  function showDetail(row) {
    const [field, description, careers] = row.profile;
    const dual = row.filiere.includes('+') ? '<p class="detail-note">يجمع هذا المسار مجالين؛ راجع المؤسسة للتحقق من توزيع الوحدات وطبيعة الشهادة.</p>' : '';
    byId('major-content').innerHTML = `<div class="dialog-main">
      <div class="dialog-top"><div class="card-meta"><span class="location-tag">${icon('map-pin')}${row.location.label}</span><bdi class="code-tag">${escapeHTML(row.code_filiere)}</bdi></div><form method="dialog"><button class="icon-button" type="submit" aria-label="إغلاق التفاصيل" autofocus>${icon('x')}</button></form></div>
      <h2 class="dialog-title" id="major-title" lang="fr" dir="ltr">${escapeHTML(row.filiere)}</h2>
      <p class="program-school" lang="fr" dir="ltr">${escapeHTML(row.etablissement)}</p>
      ${row.precision ? `<p class="program-precision" lang="fr" dir="ltr">${escapeHTML(row.precision)}</p>` : ''}
      <section><h3>${icon('book-open')} ماذا تدرس؟ <span>· ${field}</span></h3><p>${description}</p>${dual}</section>
      <section><h3>${icon('briefcase-business')} آفاق مهنية محتملة</h3><ul>${careers.map(career => `<li>${career}</li>`).join('')}</ul><p class="detail-note">أمثلة إرشادية؛ تعتمد أهلية الممارسة على الشهادة والتكوين الإضافي وشروط التوظيف أو الترخيص.</p></section>
      <section><h3>${icon('calculator')} المعدلات الدنيا حسب الأولوية</h3>${priorityList(row)}</section>
    </div>`;
    refreshIcons();
    dialog.showModal();
  }

  function onCardAction(event) {
    const button = event.target.closest('[data-save], [data-detail]');
    if (!button || !rows) return;
    if (button.dataset.detail) {
      showDetail(rows[parseInt(button.dataset.detail, 36)]);
      return;
    }
    const id = button.dataset.save;
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    history.replaceState(null, '', routeHash(parseHash().page));
    updateFavoriteLinks();
    const matching = cards.querySelector(`[data-save="${id}"]`);
    if (matching) updateSaveButton(matching, favorites.has(id));
    if (activeView === 'favorites') {
      const nextButton = button.closest('article').nextElementSibling?.querySelector('[data-save]');
      const nextId = nextButton?.dataset.save;
      renderFavorites();
      (nextId ? favoriteCards.querySelector(`[data-save="${nextId}"]`) : favoriteCards.querySelector('[data-save]') ?? byId('favorites-heading'))?.focus();
      byId('favorites-status').textContent = 'أُزيل التخصص من القائمة.';
    }
  }

  function loadData() {
    if (rows) return;
    const source = window.BAC_DATA?.rows;
    if (!Array.isArray(source) || !source.length) {
      cards.setAttribute('aria-busy', 'false');
      cards.innerHTML = emptyState('info', 'تعذّر تحميل ملف المعدلات', 'أعد تحميل الصفحة عند توفر الاتصال.');
      byId('result-count').textContent = 'لم تُحمّل البيانات';
      refreshIcons();
      return;
    }

    const schoolMap = new Map();
    const profileMap = new Map();
    const hasFourth = source.some(row => row.min4 !== null && row.min4 !== undefined && row.min4 !== '');
    const fourthOption = priority.querySelector('option[value="4"]');
    fourthOption.hidden = fourthOption.disabled = !hasFourth;
    if (!hasFourth && priority.value === '4') priority.value = '1';
    rows = source.map((row, index) => {
      const id = index.toString(36);
      const schoolKey = `${row.etb_code}:${row.etablissement}`;
      if (!schoolMap.has(schoolKey)) schoolMap.set(schoolKey, { schoolKey, etablissement: row.etablissement, location: locationFor(row.etablissement) });
      if (!profileMap.has(row.filiere)) profileMap.set(row.filiere, profileFor(row));
      const { location } = schoolMap.get(schoolKey);
      const profile = profileMap.get(row.filiere);
      const search = normalize([row.etablissement, row.etb_code, row.filiere, row.code_filiere, row.precision, location.name, location.label, profile[0]].join(' '));
      return { ...row, id, schoolKey, location, profile, search, mins: [row.min1, row.min2, row.min3, row.min4] };
    });
    schools = [...schoolMap.values()];
    byId('row-total').textContent = numberFormat.format(rows.length);
    byId('school-total').textContent = numberFormat.format(new Set(rows.map(row => row.etb_code)).size);
    cards.setAttribute('aria-busy', 'false');
    refreshSchools();
    syncRoute(false);
    renderResults();
  }

  wilaya.append(...locations.map(location => option(location.label, location.id)));
  score.addEventListener('input', () => { studentScore(); clearTimeout(pendingSearch); pendingSearch = setTimeout(renderResults, 125); });
  query.addEventListener('input', () => { clearTimeout(pendingSearch); pendingSearch = setTimeout(renderResults, 125); });
  wilaya.addEventListener('change', () => { refreshSchools(); renderResults(); });
  [school, priority, sort].forEach(control => control.addEventListener('change', renderResults));
  form.addEventListener('submit', event => {
    event.preventDefault();
    clearTimeout(pendingSearch);
    if (studentScore().invalid) { score.focus(); return; }
    renderResults();
    byId('results').focus({ preventScroll: true });
    byId('results').scrollIntoView();
  });
  form.addEventListener('reset', () => {
    clearTimeout(pendingSearch);
    setTimeout(() => { sort.value = 'official'; priority.value = '1'; studentScore(); refreshSchools(); renderResults(); });
  });
  byId('more').addEventListener('click', () => {
    const next = visibleRows.slice(pageEnd, pageEnd + pageSize);
    const { value } = studentScore();
    cards.insertAdjacentHTML('beforeend', next.map(row => card(row, value)).join(''));
    pageEnd += pageSize;
    updateCount();
    refreshIcons();
    if (next.length) cards.querySelector(`[data-save="${next[0].id}"]`)?.focus();
  });
  cards.addEventListener('click', onCardAction);
  favoriteCards.addEventListener('click', onCardAction);
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  print.addEventListener('click', () => window.print());
  share.addEventListener('click', async () => {
    const url = new URL(routeHash('favorites'), location.href).href;
    const status = byId('favorites-status');
    try {
      await navigator.clipboard.writeText(url);
      status.textContent = 'نُسخ رابط المفضلة. احتفظ به لفتح القائمة لاحقًا.';
    } catch {
      const field = document.createElement('input');
      field.type = 'url';
      field.readOnly = true;
      field.dir = 'ltr';
      field.className = 'share-fallback';
      field.value = url;
      field.setAttribute('aria-label', 'رابط المفضلة للنسخ');
      status.replaceChildren('انسخ الرابط لحفظ هذه القائمة: ', field);
      field.focus();
      field.select();
    }
  });
  document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); byId('main').focus(); });
  window.addEventListener('hashchange', () => { byId('favorites-status').textContent = ''; syncRoute(); });
  byId('lucide-script').addEventListener('load', refreshIcons);
  byId('bac-data').addEventListener('load', loadData);
  document.addEventListener('DOMContentLoaded', loadData, { once: true });
  refreshIcons();
  syncRoute(false);
  if (window.BAC_DATA?.rows) loadData();
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('app.js').catch(() => {});
}
