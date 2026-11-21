import { Product, CategoryItem, OrderItem, UserProfile, HomePageConfig } from '../types';

export const CATEGORIES: CategoryItem[] = [
  {
    name: 'Home Appliances',
    nameAr: 'أجهزة منزلية',
    icon: 'Refrigerator',
    descriptionAr: 'ثلاجات، غسالات، بوتاجازات، أطقم حلل، صواني، مجات، ومستلزمات المطبخ والسفرة (21 قسم داخلي)',
    subcategories: [
      'أطقم حلل وأواني طهي',
      'مقالي وصواني طهي',
      'صواني تقديم وطهي',
      'مجات وكاسات وشوب',
      'فناجين شاي وقهوة',
      'أطقم ملاعق وسكاكين',
      'أطقم توزيع وسيليكون',
      'أطقم توابل ومطبخ',
      'بولات تقديم وأيس كريم',
      'بمبونيرات وتحف',
      'شيالات كحك وتسالي',
      'برادات وترامس وكنك',
      'حوافظ وعلب طعام',
      'أطقم سفرة وميلامين',
      'قوالب كيك ومستلزمات فرن',
      'ثلاجات',
      'ديب فريزر',
      'غسالات ملابس وأطباق',
      'بوتاجازات ومسطحات بلت إن',
      'سخانات مياه',
      'مبردات مياه'
    ],
    subcategoriesAr: [
      'أطقم حلل وأواني طهي',
      'مقالي وصواني طهي',
      'صواني تقديم وطهي',
      'مجات وكاسات وشوب',
      'فناجين شاي وقهوة',
      'أطقم ملاعق وسكاكين',
      'أطقم توزيع وسيليكون',
      'أطقم توابل ومطبخ',
      'بولات تقديم وأيس كريم',
      'بمبونيرات وتحف',
      'شيالات كحك وتسالي',
      'برادات وترامس وكنك',
      'حوافظ وعلب طعام',
      'أطقم سفرة وميلامين',
      'قوالب كيك ومستلزمات فرن',
      'ثلاجات',
      'ديب فريزر',
      'غسالات ملابس وأطباق',
      'بوتاجازات ومسطحات بلت إن',
      'سخانات مياه',
      'مبردات مياه'
    ]
  },
  {
    name: 'Electrical Appliances',
    nameAr: 'أجهزة كهربيه',
    icon: 'Tv',
    descriptionAr: 'شاشات، هاند بلندر، مكاوي بخار، عجانات ومضارب، قلايات، غلايات، ومحضرات طعام (19 قسماً داخلياً)',
    subcategories: [
      'هاند بلندر ومحضرات',
      'مكاوي بخار',
      'محضرات طعام',
      'عجانات ومضارب بيض',
      'كبات ومفارم لحوم',
      'غلايات مياه',
      'قلايات هوائية',
      'عصارات فواكه',
      'أفران كهربائية وميكروويف',
      'صانعات قهوة ومطاحن',
      'خلاطات وعجانات',
      'مراوح سقف واستاند',
      'دفايات',
      'موازين إلكترونية',
      'توستر وساندوتش ميكر',
      'شاشات وتلفزيونات',
      'تكييفات هواء',
      'مكانس كهربائية',
      'أجهزة عناية شخصية واستشوار'
    ],
    subcategoriesAr: [
      'هاند بلندر ومحضرات',
      'مكاوي بخار',
      'محضرات طعام',
      'عجانات ومضارب بيض',
      'كبات ومفارم لحوم',
      'غلايات مياه',
      'قلايات هوائية',
      'عصارات فواكه',
      'أفران كهربائية وميكروويف',
      'صانعات قهوة ومطاحن',
      'خلاطات وعجانات',
      'مراوح سقف واستاند',
      'دفايات',
      'موازين إلكترونية',
      'توستر وساندوتش ميكر',
      'شاشات وتلفزيونات',
      'تكييفات هواء',
      'مكانس كهربائية',
      'أجهزة عناية شخصية واستشوار'
    ]
  }
];

export const INITIAL_HOMEPAGE_CONFIG: HomePageConfig = {
  announcementText: 'طنطاوي جروب: أجهزة منزلية وكهربية بأعلى ضمان في مصر • شحن لجميع المحافظات • دفع عند الاستلام بعد الفحص',
  hotline: '15218',
  whatsappNumber: '201521800000',
  heroBanners: [
    {
      id: 1,
      title: 'أجهزة منزلية كبرى بضمان الوكيل',
      subtitle: 'أحدث موديلات الثلاجات والغسالات والبوتاجازات من شارب وإل جي وبيكو وتوشيبا مع فحص الأجهزة واستلام كارت الفاتورة الرسمي',
      badge: 'ضمان الوكيل المعتمد',
      buttonText: 'تصفح الأجهزة المنزلية',
      category: 'أجهزة منزلية',
      bgGradient: 'from-blue-950 via-blue-900 to-indigo-900',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=1600&auto=format&fit=crop&q=80',
      linkCategory: 'أجهزة منزلية'
    },
    {
      id: 2,
      title: 'عالم الأجهزة الكهربية والشاشات والتكييفات',
      subtitle: 'شاشات 4K سمارت كريستال وأوليد وتكييفات انفرتر موفرة للطاقة من سامسونج وإل جي وكاريير',
      badge: 'شحن لجميع المحافظات',
      buttonText: 'تصفح الأجهزة الكهربية',
      category: 'أجهزة كهربيه',
      bgGradient: 'from-slate-950 via-slate-900 to-blue-950',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1600&auto=format&fit=crop&q=80',
      linkCategory: 'أجهزة كهربيه'
    },
    {
      id: 3,
      title: 'عروض طنطاوي جروب الحصرية اليومية',
      subtitle: 'تخفيضات كبرى تصل إلى 25% مع إمكانية الفحص الكامل واستلام كارت الفاتورة قبل سداد أي مبلغ',
      badge: 'خصومات حصرية',
      buttonText: 'مشاهدة العروض اليومية',
      category: 'عروض طنطاوي جروب اليومية',
      bgGradient: 'from-indigo-950 via-blue-950 to-red-950',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1600&auto=format&fit=crop&q=80',
      linkCategory: 'عروض طنطاوي جروب اليومية'
    }
  ],
  promoBanners: [
    {
      id: 'promo-1',
      badge: 'أجهزة منزلية كبرى',
      badgeBg: 'bg-red-600 text-white',
      title: 'ثلاجات، غسالات وبوتاجازات',
      subtitle: 'شارب، إل جي، فريش، وكاريير بضمان الوكيل المعتمد وضمان طنطاوي',
      buttonText: 'تصفح الأجهزة الكبرى',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=800&auto=format&fit=crop&q=80',
      bgGradient: 'from-blue-950 to-blue-800',
      linkCategory: 'أجهزة منزلية'
    },
    {
      id: 'promo-2',
      badge: 'شاشات وتلفزيونات 4K',
      badgeBg: 'bg-amber-500 text-black',
      title: 'شاشات سامسونج وتوشيبا وإل جي',
      subtitle: 'وضوح كريستالي مع ريسيفر داخلي وتوصيل سريع لكافة المحافظات',
      buttonText: 'تصفح الشاشات الذكية',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=800&auto=format&fit=crop&q=80',
      bgGradient: 'from-slate-900 to-indigo-950',
      linkCategory: 'أجهزة كهربيه'
    }
  ],
  sectionBanners: {
    homeAppliances: {
      badge: 'قطاع الأجهزة المنزلية • 21 قسماً',
      title: 'أجهزة منزلية وأدوات مطبخ وسفرة متكاملة',
      subtitle: 'تشكيلة واسعة من الثلاجات، الغسالات، البوتاجازات، أطقم الحلل، والسفرة بأعلى جودة وضمان معتمد.',
      buttonText: 'تصفح كل الأقسام المنزلية',
      image: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=1000&auto=format&fit=crop&q=80',
      bgGradient: 'from-blue-950 via-blue-900 to-indigo-950'
    },
    electricalAppliances: {
      badge: 'قطاع الأجهزة الكهربية والشاشات',
      title: 'أحدث الأجهزة الكهربية والشاشات والتكييفات',
      subtitle: 'شاشات 4K، تكييفات، خلاطات، قلايات هوائية، ومحضرات طعام بأقوى ضمان في مصر.',
      buttonText: 'تصفح كل الأجهزة الكهربية',
      image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=1000&auto=format&fit=crop&q=80',
      bgGradient: 'from-slate-950 via-indigo-950 to-blue-900'
    },
    deals: {
      badge: 'عروض الصاعقة الحصرية من طنطاوي جروب',
      title: 'أحدث موديلات الأجهزة والشاشات مع حق المعاينة الفورية',
      subtitle: 'أجهزة معتمدة بالضمان الرسمي لجميع معارض الجمهورية. احجز الصنف لمعاينته والتوصيل السريع حتى باب المنزل.',
      buttonText: 'اطلب العرض الآن',
      image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=1000&auto=format&fit=crop&q=80',
      bgGradient: 'from-blue-950 via-indigo-900 to-blue-900'
    }
  }
};

// تم إلغاء المنتجات التجريبية — يعتمد المتجر على قاعدة البيانات أو شيت جوجل/الإكسل فقط
export const PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: OrderItem[] = [];

export const INITIAL_USER: UserProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  avatar: ''
};

export const PROMO_CODES: Record<string, number> = {
  TANTAWY10: 10,
  TANTAWY20: 20,
  VIP30: 30,
  WELCOME: 15
};
