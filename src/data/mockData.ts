import { Product, CategoryItem, OrderItem, UserProfile } from '../types';

export const CATEGORIES: CategoryItem[] = [
  {
    name: 'Major Appliances',
    nameAr: 'أجهزة منزلية كبرى',
    icon: 'Refrigerator',
    descriptionAr: 'ثلاجات، غسالات ملابس وأطباق، بوتاجازات، ديب فريزر وتكييفات',
    subcategories: ['Refrigerators', 'Washing Machines', 'Cookers & Ovens', 'Deep Freezers', 'Air Conditioners'],
    subcategoriesAr: ['ثلاجات نوفروست', 'غسالات ملابس فول أوتوماتيك', 'بوتاجازات وأفران بلت إن', 'ديب فريزر رأسي وأفقي', 'تكييفات هواء انفرتر']
  },
  {
    name: 'Smart TVs',
    nameAr: 'شاشات وتلفزيونات',
    icon: 'Tv',
    descriptionAr: 'شاشات ذكية 4K، أوليد وكريستال سمارت من أشهر الماركات العالمية',
    subcategories: ['4K Smart TVs', 'OLED & QLED', 'Standard LED TVs', 'TV Accessories', 'Soundbars'],
    subcategoriesAr: ['شاشات 4K سمارت ريسيفر داخلي', 'شاشات OLED & QLED فائقة الدقة', 'شاشات LED اقتصادية', 'حوامل وإكسسوارات الشاشات', 'ساوند بار وأنظمة صوت']
  },
  {
    name: 'Small Appliances',
    nameAr: 'أجهزة منزلية خفيفة',
    icon: 'Sparkles',
    descriptionAr: 'قلايات هوائية، محضرات طعام، ميكروويف، مكانس، وماكينات قهوة',
    subcategories: ['Air Fryers', 'Food Processors & Blenders', 'Microwaves & Electric Ovens', 'Vacuum Cleaners', 'Coffee Makers & Kettles', 'Irons & Steamers'],
    subcategoriesAr: ['قلايات هوائية بدون زيت', 'خلاطات ومحضرات طعام', 'ميكروويف وأفران كهربائية', 'مكانس كهربائية', 'ماكينات قهوة وغلايات', 'مكاوي بخار']
  }
];

export const PRODUCTS: Product[] = [
  // Major Appliances (أجهزة منزلية كبرى)
  {
    id: '1',
    name: 'Sharp Refrigerator 450L NoFrost Digital Inverter - J-Tech',
    nameAr: 'ثلاجة شارب 450 لتر ديجيتال نوفروست انفرتر بتقنية البلازما كلاستر',
    category: 'Major Appliances',
    categoryAr: 'أجهزة منزلية كبرى',
    summary: 'High-efficiency J-Tech inverter motor with Plasmacluster ion technology and AG+ nano deodorizer.',
    summaryAr: 'موتور انفرتر موفر للكهرباء مع تقنية البلازما كلاستر لمنع الروائح والبكتيريا وضمان العربي 10 سنوات.',
    description: 'تحافظ على الأطعمة طازجة لفترات طويلة مع تبريد متساوي في كل ركن، أرفف زجاجية شديدة التحمل، وشاشة لمس ديجيتال خارجية للتحكم في درجات الحرارة بدقة.',
    descriptionAr: 'تحافظ على الأطعمة طازجة لفترات طويلة مع تبريد متساوي في كل ركن، أرفف زجاجية شديدة التحمل، وشاشة لمس ديجيتال خارجية للتحكم في درجات الحرارة بدقة.',
    actualprice: 32500,
    discountpercent: 15,
    overallrating: 4.9,
    previewimage: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'م. أحمد فتحي',
        comment: 'ثلاجة ممتازة جداً تبريد سريع جداً وصوتها هادي تماماً وضمان العربي معتمد.',
        rating: 5,
        revieweddate: '2024-03-20'
      }
    ],
    quantities: ['1', '2'],
    sizevariants: ['فضي ستانلس ستيل', 'أسود زجاجي ديجيتال'],
    isDeal: true,
    dealEndsIn: '16:40:00',
    inStock: true,
    brand: 'Sharp'
  },
  {
    id: '2',
    name: 'LG Front Load Washing Machine 9KG AI DD with Steam',
    nameAr: 'غسالة ملابس إل جي 9 كجم بالموتور المباشر AI DD وتقنية البخار',
    category: 'Major Appliances',
    categoryAr: 'أجهزة منزلية كبرى',
    summary: '9KG capacity with AI Inverter Direct Drive, TurboWash 360 and allergy care steam.',
    summaryAr: 'ذكاء اصطناعي لاختيار الدورة المناسبة ونظام البخار لتعقيم الملابس وإزالة 99.9% من مسببات الحساسية.',
    description: 'موتور دفع مباشر بدون سيور فائق الهدوء وموفر للطاقة بدرجة A+++، باب زجاجي مقوى، وحلة استانلس ستيل مضادة للبكتيريا.',
    descriptionAr: 'موتور دفع مباشر بدون سيور فائق الهدوء وموفر للطاقة بدرجة A+++، باب زجاجي مقوى، وحلة استانلس ستيل مضادة للبكتيريا.',
    actualprice: 27900,
    discountpercent: 18,
    overallrating: 4.8,
    previewimage: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'مدام جيهان',
        comment: 'غسالة رائعة وبتطلع الهدوم مكوية تقريباً بالبخار، شكراً طنطاوي جروب.',
        rating: 5,
        revieweddate: '2024-03-12'
      }
    ],
    quantities: ['1', '2'],
    sizevariants: ['سيلفر غامق', 'أبيض ناصع'],
    isDeal: true,
    dealEndsIn: '12:15:00',
    inStock: true,
    brand: 'LG'
  },
  {
    id: '3',
    name: 'Fresh Professional Cooker 5 Burners 90x60 Stainless Full Safety',
    nameAr: 'بوتاجاز فريش بروفيشنال 5 شعلة 90×60 سم ستانلس أمان كامل مع مروحة فرن',
    category: 'Major Appliances',
    categoryAr: 'أجهزة منزلية كبرى',
    summary: 'Cast iron supports, triple burner, full safety valves with dual oven fans.',
    summaryAr: 'شعلات نحاسية إيطالية، حوامل زهر ثقيلة، إشعال ذاتي كامل، ومروحة لتوزيع الحرارة داخل الفرن.',
    description: 'شعلة وسطى ثلاثية سريعة جداً، شواية دوارة، تايمر ديجيتال، وباب زجاجي هيدروليك عاكس للحرارة لسهولة الاستخدام والتنظيف.',
    descriptionAr: 'شعلة وسطى ثلاثية سريعة جداً، شواية دوارة، تايمر ديجيتال، وباب زجاجي هيدروليك عاكس للحرارة لسهولة الاستخدام والتنظيف.',
    actualprice: 15800,
    discountpercent: 12,
    overallrating: 4.7,
    previewimage: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1'],
    sizevariants: ['ستانلس ستيل بالكامل'],
    isDeal: false,
    inStock: true,
    brand: 'Fresh'
  },
  {
    id: '4',
    name: 'Carrier Optimax Inverter Air Conditioner 1.5 HP Cool/Heat',
    nameAr: 'تكييف كاريير أوبتيماكس انفرتر 1.5 حصان بارد/ساخن بلازما جرين',
    category: 'Major Appliances',
    categoryAr: 'أجهزة منزلية كبرى',
    summary: 'Energy-saving inverter compressor with ionizer plasma green filter and smart display.',
    summaryAr: 'توفير حتى 50% من استهلاك الكهرباء، تنقية هواء شاملة، وتبريد فائق السرعة مع تدفق هواء رباعي الاتجاهات.',
    description: 'يعمل بكفاءة عالية في درجات الحرارة المرتفعة، وظيفة التنظيف الذاتي ومبادل حراري معالج ضد الصدأ والتآكل.',
    descriptionAr: 'يعمل بكفاءة عالية في درجات الحرارة المرتفعة، وظيفة التنظيف الذاتي ومبادل حراري معالج ضد الصدأ والتآكل.',
    actualprice: 26500,
    discountpercent: 10,
    overallrating: 4.9,
    previewimage: 'https://images.unsplash.com/photo-1614633833026-0820552978b6?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1614633833026-0820552978b6?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1', '2'],
    sizevariants: ['1.5 حصان بارد/ساخن'],
    isDeal: true,
    dealEndsIn: '08:45:00',
    inStock: true,
    brand: 'Carrier'
  },

  // Smart TVs (شاشات وتلفزيونات)
  {
    id: '5',
    name: 'Samsung 55-inch Crystal UHD 4K Smart TV CU7000',
    nameAr: 'شاشة سامسونج 55 بوصة كريستال 4K الترا HD سمارت بريسيفر داخلي',
    category: 'Smart TVs',
    categoryAr: 'شاشات وتلفزيونات',
    summary: 'Dynamic Crystal Color with Crystal Processor 4K, HDR10+ and Tizen OS.',
    summaryAr: 'ألوان كريستالية نقية بدقة 4K فائقة الوضوح مع نظام تايزن الذكي، يوتيوب، نتفليكس وشاهد مدمجة.',
    description: 'شاشة بدون حواف بتصميم نحيف للغاية، نظام صوت محيطي تكيفي، ريموت تحكم ذكي، مع منافذ متعددة HDMI و USB.',
    descriptionAr: 'شاشة بدون حواف بتصميم نحيف للغاية، نظام صوت محيطي تكيفي، ريموت تحكم ذكي، مع منافذ متعددة HDMI و USB.',
    actualprice: 18499,
    discountpercent: 22,
    overallrating: 4.9,
    previewimage: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'أحمد شريف',
        comment: 'شاشة خرافية ألوانها مبهرة والصوت نقي جداً، ضمان الوكيل الأصلي وسعر طنطاوي الأفضل.',
        rating: 5,
        revieweddate: '2024-03-10'
      }
    ],
    quantities: ['1', '2'],
    sizevariants: ['55 بوصة 4K', '65 بوصة 4K'],
    isDeal: true,
    dealEndsIn: '09:20:15',
    inStock: true,
    brand: 'Samsung'
  },
  {
    id: '6',
    name: 'LG 65-inch OLED 4K Cinema Screen Smart webOS with Magic Remote',
    nameAr: 'شاشة إل جي 65 بوصة OLED 4K سينمائية سمارت بالريموت السحري ومعدل 120Hz',
    category: 'Smart TVs',
    categoryAr: 'شاشات وتلفزيونات',
    summary: 'Self-lit OLED pixels for infinite contrast, Dolby Vision IQ & Atmos with α7 AI Gen6.',
    summaryAr: 'بكسلات ذاتية الإضاءة تمنح سواداً مطلقاً وألواناً واقعية مع دعم الألعاب 120 هرتز وتقنية دولبي أتموس.',
    description: 'أقوى تجربة مشاهدة سينمائية منزلية مع معالج الذكاء الاصطناعي من إل جي، نظام webOS السلس والريموت السحري بالماوس الهوائي.',
    descriptionAr: 'أقوى تجربة مشاهدة سينمائية منزلية مع معالج الذكاء الاصطناعي من إل جي، نظام webOS السلس والريموت السحري بالماوس الهوائي.',
    actualprice: 48900,
    discountpercent: 16,
    overallrating: 5.0,
    previewimage: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1'],
    sizevariants: ['65 بوصة OLED'],
    isDeal: false,
    inStock: true,
    brand: 'LG'
  },
  {
    id: '7',
    name: 'Toshiba 43-inch Full HD Smart Android TV with Voice Remote',
    nameAr: 'شاشة توشيبا 43 بوصة سمارت أندرويد Full HD بريموت صوتي بلوتوث',
    category: 'Smart TVs',
    categoryAr: 'شاشات وتلفزيونات',
    summary: 'Official Android TV with Google Assistant, Chromecast built-in and DTS Virtual:X.',
    summaryAr: 'نظام تشغيل أندرويد الرسمي متجر جوجل بلاي، أوامر صوتية، وصوت سينمائي مجسم بضمان العربي 3 سنوات.',
    description: 'شاشة مثالية لغرف النوم والمعيشة، تدعم تشغيل كافة التطبيقات والألعاب بدقة Full HD واضحة وألوان ساطعة.',
    descriptionAr: 'شاشة مثالية لغرف النوم والمعيشة، تدعم تشغيل كافة التطبيقات والألعاب بدقة Full HD واضحة وألوان ساطعة.',
    actualprice: 11499,
    discountpercent: 14,
    overallrating: 4.8,
    previewimage: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1', '2', '3'],
    sizevariants: ['43 بوصة سمارت'],
    isDeal: true,
    dealEndsIn: '18:10:00',
    inStock: true,
    brand: 'Toshiba'
  },

  // Small & Light Appliances (أجهزة منزلية خفيفة)
  {
    id: '8',
    name: 'Philips XXL Air Fryer 7.3L 2225W Digital with Fat Removal',
    nameAr: 'قلاية هوائية فيليبس XXL سعة 7.3 لتر 2225 واط ديجيتال بتقنية إزالة الدهون',
    category: 'Small Appliances',
    categoryAr: 'أجهزة منزلية خفيفة',
    summary: 'Rapid Air technology for 90% less oil cooking with Twin TurboStar fat removal.',
    summaryAr: 'سعة عائلية ضخمة تسع دجاجة كاملة أو 1.4 كجم بطاطس، طعام مقرمش وصحي بدون زيت وشاشة لمس ديجيتال.',
    description: 'أفضل قلاية هوائية رقم 1 عالمياً مع 5 برامج طهي مسبقة الإعداد، خاصية حفظ السخونة وسهلة الغسيل في غسالة الأطباق.',
    descriptionAr: 'أفضل قلاية هوائية رقم 1 عالمياً مع 5 برامج طهي مسبقة الإعداد، خاصية حفظ السخونة وسهلة الغسيل في غسالة الأطباق.',
    actualprice: 9999,
    discountpercent: 25,
    overallrating: 4.9,
    previewimage: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'سارة عبد الرحمن',
        comment: 'تحفة بجد وسريعة جداً وبتطلع الأكل مقرمش وخفيف من غير دهون خالص.',
        rating: 5,
        revieweddate: '2024-03-15'
      }
    ],
    quantities: ['1', '2', '3'],
    sizevariants: ['أسود لامع ديجيتال'],
    isDeal: true,
    dealEndsIn: '05:30:00',
    inStock: true,
    brand: 'Philips'
  },
  {
    id: '9',
    name: 'Kenwood MultiPro Food Processor 1000W 34 Functions',
    nameAr: 'محضر طعام كينوود مالتي برو 1000 واط - 34 وظيفة مع خلاط زجاج ومطحنة',
    category: 'Small Appliances',
    categoryAr: 'أجهزة منزلية خفيفة',
    summary: 'Heavy-duty 1000W motor with 3L bowl, thermo-resist blender and citrus press.',
    summaryAr: 'جهاز مطبخ متكامل للعجن، التقطيع، الفرم، الخفق، وعصر الفواكه بموتور نحاسي قوي وشفرات ستانلس حادة.',
    description: 'يتحمل المهام الشاقة وسهل الاستخدام، أداء استثنائي لفرم اللحوم وإعداد المعجنات والعصائر الطازجة بثوانٍ.',
    descriptionAr: 'يتحمل المهام الشاقة وسهل الاستخدام، أداء استثنائي لفرم اللحوم وإعداد المعجنات والعصائر الطازجة بثوانٍ.',
    actualprice: 4999,
    discountpercent: 20,
    overallrating: 4.8,
    previewimage: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1', '2', '3'],
    sizevariants: ['ستانلس ستيل x أسود'],
    isDeal: true,
    dealEndsIn: '14:20:00',
    inStock: true,
    brand: 'Kenwood'
  },
  {
    id: '10',
    name: 'Sharp Microwave 25L with Grill 1000W Digital Mirror Finish',
    nameAr: 'ميكروويف شارب 25 لتر بالشواية 1000 واط ديجيتال باب مرآة فاخر',
    category: 'Small Appliances',
    categoryAr: 'أجهزة منزلية خفيفة',
    summary: 'Digital touch controls, 8 auto cooking menus, defrost by weight and child lock.',
    summaryAr: 'تسخين وطهي وشواء سريع، 8 برامج طهي تلقائية، إذابة التجميد بالوزن والوقت، وضمان العربي سنتين.',
    description: 'تصميم أنيق بباب مرآة، صينية دوارة زجاجية متينة، وتحكم دقيق في مستويات الطاقة مع قفل أمان للأطفال.',
    descriptionAr: 'تصميم أنيق بباب مرآة، صينية دوارة زجاجية متينة، وتحكم دقيق في مستويات الطاقة مع قفل أمان للأطفال.',
    actualprice: 6850,
    discountpercent: 18,
    overallrating: 4.7,
    previewimage: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1', '2'],
    sizevariants: ['فضي باب مرآة'],
    isDeal: false,
    inStock: true,
    brand: 'Sharp'
  },
  {
    id: '11',
    name: 'Panasonic Vacuum Cleaner 2000W Heavy Duty Drum Japan C-20E',
    nameAr: 'مكنسة باناسونيك برميل 2000 واط سعة 18 لتر موتور ياباني أصلي',
    category: 'Small Appliances',
    categoryAr: 'أجهزة منزلية خفيفة',
    summary: '2000W high-power motor with 18L dust capacity, anti-bacterial filter and blower function.',
    summaryAr: 'قوة شفط جبارة للمنازل الواسعة والسجاد، سعة تانك ضخمة، فلتر معالج ضد البكتيريا، وخاصية طرد الهواء (Blower).',
    description: 'صناعة متينة بهيكل معدني ثقيل، كابل طويل بمدى حركة واسع، ملحقات للأركان والستائر والفرش لتنظيف عميق.',
    descriptionAr: 'صناعة متينة بهيكل معدني ثقيل، كابل طويل بمدى حركة واسع، ملحقات للأركان والستائر والفرش لتنظيف عميق.',
    actualprice: 7900,
    discountpercent: 15,
    overallrating: 4.9,
    previewimage: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1', '2'],
    sizevariants: ['أحمر نبيتي معدني'],
    isDeal: true,
    dealEndsIn: '11:10:00',
    inStock: true,
    brand: 'Panasonic'
  },
  {
    id: '12',
    name: 'DeLonghi Dedica Espresso Coffee Machine 15 Bar Stainless Steel',
    nameAr: 'ماكينة قهوة اسبريسو ديلونجي ديديكا 15 بار ستانلس ستيل مع مبخر الحليب',
    category: 'Small Appliances',
    categoryAr: 'أجهزة منزلية خفيفة',
    summary: '15-bar professional pressure with ThermoBlock heating system and adjustable cappuccino frother.',
    summaryAr: 'تحضير الاسبريسو، الكابتشينو واللاتيه بكريمة غنية مثل الكافيهات الإيطالية بجسم ستانلس ستيل مدمج.',
    description: 'تسخين سريع في 35 ثانية فقط، تسع للأكواب العالية وتدعم استخدام البن المطحون أو كبسولات ESE.',
    descriptionAr: 'تسخين سريع في 35 ثانية فقط، تسع للأكواب العالية وتدعم استخدام البن المطحون أو كبسولات ESE.',
    actualprice: 8400,
    discountpercent: 22,
    overallrating: 4.9,
    previewimage: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'محمود عبد المنعم',
        comment: 'قهوة ممتازة ورغوة حليب كريمية جداً، ماكينة عملية وجميلة على رخامة المطبخ.',
        rating: 5,
        revieweddate: '2024-03-05'
      }
    ],
    quantities: ['1', '2'],
    sizevariants: ['فضي كروم', 'أحمر ميتاليك'],
    isDeal: true,
    dealEndsIn: '06:15:30',
    inStock: true,
    brand: 'DeLonghi'
  }
];

export const INITIAL_ORDERS: OrderItem[] = [
  {
    orderid: 'TG-83533963',
    name: 'Samsung 55-inch Crystal UHD 4K Smart TV',
    nameAr: 'شاشة سامسونج 55 بوصة كريستال 4K الترا HD سمارت',
    description: 'Delivery expected within 24-48 business hours.',
    descriptionAr: 'قيد الشحن مع مندوب طنطاوي جروب - متوقع التسليم غداً مع حق المعاينة.',
    status: 'Dispatched',
    productimage: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
    price: 14429,
    date: '2024-04-12'
  },
  {
    orderid: 'TG-63428737',
    name: 'Philips XXL Air Fryer 7.3L',
    nameAr: 'قلاية هوائية فيليبس XXL سعة 7.3 لتر ديجيتال',
    description: 'Order was cancelled per customer request.',
    descriptionAr: 'تم إلغاء الطلب بناء على طلب العميل.',
    status: 'Cancelled',
    productimage: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
    price: 7499,
    date: '2024-03-18'
  },
  {
    orderid: 'TG-83658319',
    name: 'Sharp Refrigerator 450L NoFrost Digital Inverter',
    nameAr: 'ثلاجة شارب 450 لتر ديجيتال نوفروست انفرتر',
    description: 'Delivered successfully and signed by customer.',
    descriptionAr: 'تم التسليم بنجاح والمعاينة وتم تقييم الطلب بـ 5 نجوم.',
    status: 'Completed',
    productimage: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?w=800&auto=format&fit=crop&q=80',
    price: 27625,
    date: '2024-02-25'
  }
];

export const INITIAL_USER: UserProfile = {
  name: 'أحمد محمود العوضي',
  email: 'ahmed.elawadi@example.com',
  phone: '+20 102 345 6789',
  address: 'شارع فيصل الرئيسي، بجوار معرض طنطاوي جروب، الدور الرابع',
  city: 'الجيزة، مصر',
  avatar: '/assets/avatar2.png'
};

export const PROMO_CODES: Record<string, number> = {
  TANTAWY10: 10,
  TANTAWY20: 20,
  VIP30: 30,
  WELCOME: 15
};
