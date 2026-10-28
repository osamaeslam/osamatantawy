import { Product, CategoryItem, OrderItem, TeamMember, UserProfile } from '../types';

export const CATEGORIES: CategoryItem[] = [
  {
    name: 'Home & Kitchen',
    nameAr: 'أدوات وأجهزة منزلية',
    icon: 'CookingPot',
    descriptionAr: 'حلل جرانيت، أطقم عشاء، أجهزة كهربائية ومفروشات',
    subcategories: ['Cookware & Pots', 'Dinner Sets', 'Kitchen Gadgets', 'Blenders & Mixers', 'Small Appliances'],
    subcategoriesAr: ['أواني وحلل', 'أطقم صيني وعشاء', 'مستلزمات مطبخ', 'خلاطات ومحضرات طعام', 'أجهزة مطبخ صغيرة']
  },
  {
    name: 'Electronics',
    nameAr: 'الأجهزة الكهربائية',
    icon: 'Tv',
    descriptionAr: 'شاشات ذكية، غسالات، ثلاجات، ومكيفات هواء',
    subcategories: ['Televisions', 'Refrigerators', 'Washing Machines', 'Air Conditioners', 'Microwaves'],
    subcategoriesAr: ['شاشات تلفزيون', 'ثلاجات وديب فريزر', 'غسالات ملابس', 'مكيفات هواء', 'ميكروويف وفرن']
  },
  {
    name: 'Mobile Phones',
    nameAr: 'الموبايلات والإكسسوارات',
    icon: 'Smartphone',
    descriptionAr: 'هواتف ذكية، شواحن، سماعات، وبنوك طاقة',
    subcategories: ['Smartphones', 'Tablets', 'Chargers & Cables', 'Earphones & Headphones', 'Power Banks'],
    subcategoriesAr: ['هواتف ذكية', 'أجهزة لوحية', 'شواحن وكابلات', 'سماعات رأس وبلوتوث', 'بنوك طاقة']
  },
  {
    name: 'Home Furniture',
    nameAr: 'أثاث ومفروشات المنزل',
    icon: 'Armchair',
    descriptionAr: 'سجاد، ملايات، ستائر، وأطقم لحاف شتوي وصيفي',
    subcategories: ['Curtains & Drapes', 'Bed Sheets & Quilts', 'Carpets & Rugs', 'Living Room', 'Towels'],
    subcategoriesAr: ['ستائر وديكورات', 'ملايات وألحفة', 'سجاد وموكيت', 'أثاث منزلي', 'مناشف وبشاكير']
  },
  {
    name: 'Fashion',
    nameAr: 'أزياء وملابس وموضة',
    icon: 'Shirt',
    descriptionAr: 'ملابس رجالي، حريمي، وأطفال بأفضل الخامات',
    subcategories: ['Women Fashion', 'Men Fashion', 'Kids Wear', 'Shoes & Bags', 'Winter Collection'],
    subcategoriesAr: ['أزياء نسائية', 'ملابس رجالية', 'ملابس أطفال', 'أحذية وحقائب', 'كولكشن الشتاء']
  },
  {
    name: 'Personal Care',
    nameAr: 'العناية الشخصية والجمال',
    icon: 'Sparkles',
    descriptionAr: 'مجففات شعر، ماكينات حلاقة، وأجهزة تجميل',
    subcategories: ['Hair Dryers & Stylers', 'Men Grooming', 'Skin Care', 'Oral Care', 'Perfumes'],
    subcategoriesAr: ['استشوار ومكواة شعر', 'ماكينات حلاقة رجالي', 'عناية بالبشرة', 'عناية بالأسنان', 'عطور']
  },
  {
    name: 'Toys & Baby',
    nameAr: 'ألعاب وأطفال',
    icon: 'Baby',
    descriptionAr: 'ألعاب تعليمية، عربات أطفال ومستلزمات الرضع',
    subcategories: ['Educational Toys', 'Baby Strollers', 'Feeding Supplies', 'Dolls & Action Figures', 'Outdoor Play'],
    subcategoriesAr: ['ألعاب تعليمية', 'عربات أطفال', 'مستلزمات رضاعة', 'دمى وشخصيات', 'ألعاب حدائق']
  }
];

export const PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Tefal Titanium Granite Cookware Set 10 Pcs',
    nameAr: 'طقم جرانيت تيفال تيتانيوم 10 قطع - غير لاصق فاخر',
    category: 'Home & Kitchen',
    categoryAr: 'أدوات وأجهزة منزلية',
    summary: 'Premium 10-piece non-stick granite cookware set with heat-resistant tempered glass lids.',
    summaryAr: 'طقم أواني طهي جرانيت تركي غير لاصق 10 قطع مع أغطية زجاج حراري ومقابض عازلة للحرارة.',
    description: 'Manufactured with high-durability titanium particles for effortless food release and scratch resistance. Ideal for healthy low-fat cooking and compatible with all stovetops.',
    descriptionAr: 'مصنوع بتقنية التيتانيوم المقاومة للخدش بأعلى جودة. توزيع متساوي للحرارة لطهي مثالي بدون زيت أو دهون زائدة. آمن لغسالة الأطباق.',
    actualprice: 3499,
    discountpercent: 30,
    overallrating: 4.8,
    previewimage: 'https://images.unsplash.com/photo-1584990347449-397ddc99db15?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1584990347449-397ddc99db15?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'سارة عبد الله',
        comment: 'خامة ممتازة جداً وأصلية 100% والتوصيل كان سريع خلال 48 ساعة.',
        rating: 5,
        revieweddate: '2024-03-15'
      },
      {
        customername: 'منى محمود',
        comment: 'حقيقي تحفة وأحسن من الصورة بكتير.. شكراً رنين!',
        rating: 5,
        revieweddate: '2024-03-10'
      }
    ],
    quantities: ['1', '2', '3', '5'],
    sizevariants: ['رمادي فحمي', 'وردي باستيل', 'أسود ملكي'],
    isDeal: true,
    dealEndsIn: '14:25:40',
    inStock: true,
    brand: 'Tefal'
  },
  {
    id: '2',
    name: 'Samsung 55-inch 4K UHD Smart Crystal TV',
    nameAr: 'شاشة سامسونج 55 بوصة سمارت 4K كريستال الترا HD مع ريموت ذكي',
    category: 'Electronics',
    categoryAr: 'الأجهزة الكهربائية',
    summary: 'Ultra-thin bezels, Dynamic Crystal Color with HDR10+ and built-in Tizen OS.',
    summaryAr: 'شاشة سمارت ريسيفر داخلي بدقة 4K وتقنية الألوان الكريستالية مع دعم نتفليكس وشاهد ويوتيوب.',
    description: 'Immerse yourself in picture with one billion shades of color. Crystal Processor 4K delivers true-to-life color expressions and fluid motion.',
    descriptionAr: 'معالج كريستال 4K يرفع جودة المحتوى إلى دقة فائقة الوضوح. صوت تكيفي ومنافذ متعددة HDMI و USB.',
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
        comment: 'شاشة خرافية ألوانها مبهرة والصوت نقي جداً، وضمان العربي الأصلي.',
        rating: 5,
        revieweddate: '2024-02-28'
      }
    ],
    quantities: ['1', '2'],
    sizevariants: ['55 بوصة', '65 بوصة'],
    isDeal: true,
    dealEndsIn: '08:12:15',
    inStock: true,
    brand: 'Samsung'
  },
  {
    id: '3',
    name: 'Kenwood MultiPro Food Processor 1000W',
    nameAr: 'محضر طعام كينوود مالتي برو 1000 واط - 34 وظيفة متعددة',
    category: 'Home & Kitchen',
    categoryAr: 'أدوات وأجهزة منزلية',
    summary: 'Heavy-duty 1000W motor with 3L bowl, thermo-resist blender and citrus press.',
    summaryAr: 'محضر طعام متكامل 34 وظيفة مع دورق زجاج مقاوم للحرارة، مطحنة توابل، وعصارة حمضيات.',
    description: 'Designed to handle tough doughs, rapid chopping, shredding, and velvety smoothies with dual-drive tech.',
    descriptionAr: 'شفرات من الفولاذ المقاوم للصدأ مع سرعتين ونبضات لحظية لإعداد جميع الوجبات المنزلية والعصائر بسهولة.',
    actualprice: 4999,
    discountpercent: 25,
    overallrating: 4.7,
    previewimage: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'هدير كمال',
        comment: 'عملي جدا ومريح في الاستخدام وفر عليا وقت ومجهود كبير في المطبخ.',
        rating: 5,
        revieweddate: '2024-01-20'
      }
    ],
    quantities: ['1', '2', '3'],
    sizevariants: ['سيلفر ستانلس'],
    isDeal: false,
    inStock: true,
    brand: 'Kenwood'
  },
  {
    id: '4',
    name: 'Xiaomi Redmi Note 13 Pro 4G - 256GB / 8GB RAM',
    nameAr: 'شاومي ريدمي نوت 13 برو - 256 جيجا، 8 رام مع كاميرا 200 ميجابكسل',
    category: 'Mobile Phones',
    categoryAr: 'الموبايلات والإكسسوارات',
    summary: '200MP camera with OIS, 120Hz AMOLED display and 67W Turbo charging.',
    summaryAr: 'كاميرا خارقة بدقة 200 ميجابكسل، شاشة أموليد 120 هرتز فائقة النعومة، وشاحن سريع بقوة 67 واط.',
    description: 'Exceptional photography experience with flagship-grade sensor. Fast battery charging 0 to 100% in 45 minutes.',
    descriptionAr: 'أحدث هواتف الفئة المتوسطة العليا من شاومي ببطارية 5000 مللي أمبير تدوم يومين عمل كاملين.',
    actualprice: 13999,
    discountpercent: 15,
    overallrating: 4.8,
    previewimage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'إسلام عصام',
        comment: 'الموبايل طيارة والشاحن صاروخ في العلبة، رنين دايما عروضهم صادقة.',
        rating: 5,
        revieweddate: '2024-03-02'
      }
    ],
    quantities: ['1', '2'],
    sizevariants: ['أسود كربوني', 'أزرق محيطي', 'أخضر غابات'],
    isDeal: true,
    dealEndsIn: '18:50:00',
    inStock: true,
    brand: 'Xiaomi'
  },
  {
    id: '5',
    name: 'Tornado Turkish Coffee Maker 330ml 735W',
    nameAr: 'ماكينة قهوة تركي تورنيدو 735 واط - سعة 4 فناجين مع سينسور ضد الفوران',
    category: 'Home & Kitchen',
    categoryAr: 'أدوات وأجهزة منزلية',
    summary: 'Prepares classic Turkish coffee with rich crema and smart overflow protection.',
    summaryAr: 'تحضير القهوة التركية مع رغوة كريمية غنية ونظام أمان ذكي يمنع فوران القهوة.',
    description: 'Cordless kettle convenience with 360-degree base and touch LED control indicator.',
    descriptionAr: 'قاعدة ستانلس ستيل وإضاءة تنبيه عند انتهاء القهوة بلمسة واحدة سريعة ومثالية للمنزل والمكتب.',
    actualprice: 1799,
    discountpercent: 28,
    overallrating: 4.6,
    previewimage: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'ياسمين حسن',
        comment: 'وش القهوة بيطلع مظبوط جداً زي الكنكة النحاس بالظبط.',
        rating: 5,
        revieweddate: '2024-02-14'
      }
    ],
    quantities: ['1', '2', '3'],
    sizevariants: ['أحمر نبيتي', 'بني قهوة', 'أبيض ثلجي'],
    isDeal: true,
    dealEndsIn: '05:30:20',
    inStock: true,
    brand: 'Tornado'
  },
  {
    id: '6',
    name: 'Luxurious Winter Microfiber Comforter Set 5 Pcs',
    nameAr: 'طقم لحاف شتوي سرير كبير فايبر دبل فيس 5 قطع - ألوان عصرية',
    category: 'Home Furniture',
    categoryAr: 'أثاث ومفروشات المنزل',
    summary: 'Ultra-soft microfiber winter comforter with 2 pillowcases and 2 cushions.',
    summaryAr: 'طقم لحاف شتوي دافئ ناعم بوجهين، مقاس 240×260 سم مع خداديات أنيقة.',
    description: 'Hypoallergenic fiber filling that gives deep warmth while remaining breathable and lightweight.',
    descriptionAr: 'خامات تركي معالجة ضد الانكماش والوبر مع ألوان مبهجة تناسب أحدث ديكورات غرف النوم.',
    actualprice: 1850,
    discountpercent: 35,
    overallrating: 4.7,
    previewimage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1', '2'],
    sizevariants: ['كشمير x رمادي', 'بترولي x سكري', 'موف x فضي'],
    isDeal: false,
    inStock: true,
    brand: 'Raneen Home'
  },
  {
    id: '7',
    name: 'Philips Hair Dryer DryCare Essential 2100W',
    nameAr: 'مجفف شعر فيليبس دراي كير 2100 واط مع تقنية الأيونات وخاصية الهواء البارد',
    category: 'Personal Care',
    categoryAr: 'العناية الشخصية والجمال',
    summary: 'Ionic conditioning for shiny, frizz-free hair with ThermoProtect heat setting.',
    summaryAr: 'تجفيف سريع وحماية متطورة للشعر من درجات الحرارة العالية مع تدفق أيوني يمنع الهيشان.',
    description: '6 flexible speed and temperature settings for complete control and cool shot for style fixation.',
    descriptionAr: 'تصميم مريح مع فوهة تركيز رفيعة لتصفيف دقيق ونتائج صالونات احترافية.',
    actualprice: 1450,
    discountpercent: 20,
    overallrating: 4.9,
    previewimage: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [],
    quantities: ['1', '2'],
    sizevariants: ['أسود لامع x ذهبي'],
    isDeal: true,
    dealEndsIn: '11:15:00',
    inStock: true,
    brand: 'Philips'
  },
  {
    id: '8',
    name: 'Sharp Air Fryer XL 5.5L Digital Touch 1800W',
    nameAr: 'قلاية هوائية ديجيتال شارب بدون زيت 5.5 لتر 1800 واط - 8 برامج ذكية',
    category: 'Home & Kitchen',
    categoryAr: 'أدوات وأجهزة منزلية',
    summary: 'Healthier crispy meals with up to 90% less oil and rapid air circulation.',
    summaryAr: 'قلي وتحمير وشوي صحي بدون زيت بفضل دوران الهواء الساخن السريع مع شاشة لمس ديجيتال.',
    description: 'Large capacity suitable for entire family. Easy-to-clean non-stick basket and auto-shutoff timer.',
    descriptionAr: 'سعة 5.5 لتر تكفي حتى 1.5 كجم بطاطس أو دجاجة كاملة، موفرة للطاقة وسهلة الغسيل.',
    actualprice: 4500,
    discountpercent: 32,
    overallrating: 4.8,
    previewimage: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
    previewimages: [
      'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80'
    ],
    reviews: [
      {
        customername: 'كريم عادل',
        comment: 'ممتازة جدا في البطاطس والستربس والسمبوسة من غير نقطة زيت.',
        rating: 5,
        revieweddate: '2024-03-01'
      }
    ],
    quantities: ['1', '2', '3'],
    sizevariants: ['أسود ديجيتال'],
    isDeal: true,
    dealEndsIn: '03:45:10',
    inStock: true,
    brand: 'Sharp'
  }
];

export const INITIAL_ORDERS: OrderItem[] = [
  {
    orderid: 'TG-83533963',
    name: 'Tefal Titanium Granite Cookware Set 10 Pcs',
    nameAr: 'طقم جرانيت تيفال تيتانيوم 10 قطع',
    description: 'Delivery expected within 2-3 business days.',
    descriptionAr: 'قيد الشحن مع مندوب طنطاوي جروب - متوقع التسليم غداً.',
    status: 'Dispatched',
    productimage: 'https://images.unsplash.com/photo-1584990347449-397ddc99db15?w=800&auto=format&fit=crop&q=80',
    price: 2449,
    date: '2024-04-12'
  },
  {
    orderid: 'TG-63428737',
    name: 'Tornado Turkish Coffee Maker',
    nameAr: 'ماكينة قهوة تركي تورنيدو',
    description: 'Order was cancelled per customer request.',
    descriptionAr: 'تم إلغاء الطلب بناء على طلب العميل.',
    status: 'Cancelled',
    productimage: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
    price: 1295,
    date: '2024-03-18'
  },
  {
    orderid: 'TG-83658319',
    name: 'Luxurious Winter Comforter Set 5 Pcs',
    nameAr: 'طقم لحاف شتوي سرير كبير 5 قطع',
    description: 'Delivered successfully and signed by customer.',
    descriptionAr: 'تم التسليم بنجاح مع حق المعاينة وتم تقييم الطلب بـ 5 نجوم.',
    status: 'Completed',
    productimage: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&auto=format&fit=crop&q=80',
    price: 1202,
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

