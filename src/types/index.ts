export interface Review {
  customername: string;
  comment: string;
  rating: number | string;
  revieweddate: string;
  profileimage?: string;
}

export interface Product {
  id: string;
  name: string;
  nameAr: string;
  category: string;
  categoryAr: string;
  summary: string;
  summaryAr: string;
  description: string;
  descriptionAr: string;
  actualprice: number;
  discountpercent: number;
  overallrating: number;
  previewimage: string;
  previewimages: string[];
  reviews: Review[];
  quantities: string[];
  sizevariants: string[];
  isDeal?: boolean;
  dealEndsIn?: string;
  inStock?: boolean;
  brand?: string;
}

export interface CategoryItem {
  name: string;
  nameAr: string;
  icon: string;
  image?: string;
  descriptionAr: string;
  subcategories: string[];
  subcategoriesAr: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface OrderItem {
  orderid: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  status: 'Dispatched' | 'Cancelled' | 'Completed' | 'Processing';
  productimage: string;
  price: number;
  date: string;
}

export interface TeamMember {
  employeeName: string;
  image: string;
  designation: string;
  roleAr: string;
  bioAr: string;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  avatar: string;
}
