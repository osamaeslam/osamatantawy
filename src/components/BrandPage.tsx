import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, Heart, PhoneCall, Info, Package, List, Grid3X3, Scale } from 'lucide-react';
import { getSafeImageSrc } from '../utils/imageHelper';
import { normalizeImageUrl } from '../services/image-url';
import { getStockMeta } from '../utils/stockStatus';
import { productService } from '../supabase/products.service';
import {
  STOREFRONT_TEXT,
  getLocalizedProductName,
  getLocalizedProductCategory,
} from '../i18n/translations';

interface BrandPageProps {
  brandName: string;
}

export const BrandPage: React.FC<BrandPageProps> = ({ brandName }) => {
  const {
    products,
    toggleWishlist,
    isInWishlist,
    setQuickViewProduct,
    stockStatusMap,
    supabaseProductCount,
    mergeProductsIntoState,
    toggleCompare,
    isInCompare,
    language,
  } = useApp();

  const isRtl = language === 'ar';
  const t = STOREFRONT_TEXT[language].brands;
  const th = STOREFRONT_TEXT[language].home;
  const tn = STOREFRONT_TEXT[language].nestedCats;

  useEffect(() => {
    if (brandName && supabaseProductCount > products.length) {
      productService
        .getMappedByBrand(brandName, 60)
        .then((items) => mergeProductsIntoState(items))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandName, supabaseProductCount]);

  const [viewStyle, setViewStyle] = useState<'grid' | 'list'>('grid');

  const brandProducts = products.filter((p) => p.brand === brandName);

  return (
    <div className="space-y-6 pb-24">
      <div className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-200 ${isRtl ? 'text-right' : 'text-left'}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-blue-900">{brandName}</h1>
            <p className="text-gray-500 text-sm">
              {t.brandProductsDesc(brandName)}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
            <span className="text-xs font-bold text-gray-600">{brandProducts.length} {tn.productUnit}</span>
            <button
              onClick={() => setViewStyle(viewStyle === 'grid' ? 'list' : 'grid')}
              className="p-1 hover:bg-gray-200 rounded transition"
              title={isRtl ? 'تغيير طريقة العرض' : 'Toggle View'}
            >
              {viewStyle === 'grid' ? <List size={16} /> : <Grid3X3 size={16} />}
            </button>
          </div>
        </div>
        <div className={`bg-yellow-50 border border-yellow-200 rounded-xl p-4 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="flex items-start gap-3">
            <Info size={18} className="text-yellow-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-yellow-800">{t.wholesaleNoticeTitle}</h3>
              <p className="text-xs text-yellow-700 mt-1">
                {t.wholesaleNoticeBody}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {brandProducts.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-gray-200">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-gray-800">
              {t.noBrandProducts}
            </h3>
          </div>
        ) : (
          brandProducts.map((product) => {
            const stockMeta = getStockMeta(product, stockStatusMap, language);
            const pName = getLocalizedProductName(product, language);
            const pCat = getLocalizedProductCategory(product, language);
            return (
              <div
                key={product.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition group"
              >
                <div
                  onClick={() => setQuickViewProduct(product)}
                  className="aspect-[4/5] bg-gray-50 rounded-t-2xl overflow-hidden cursor-pointer border-b border-gray-50 group-hover:border-blue-100 relative"
                >
                  <img
                    src={getSafeImageSrc(normalizeImageUrl(product.previewimage, undefined, 500))} referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                    alt={pName}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-[11px] font-bold px-2 py-1 rounded flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${stockMeta.dotClass}`} />
                    <span>{stockMeta.shortLabel}</span>
                  </div>
                </div>
                <div className={`p-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md mb-2 block">
                    {pCat}
                  </span>
                  <h3
                    onClick={() => setQuickViewProduct(product)}
                    className="text-base font-bold text-gray-800 hover:text-blue-600 transition line-clamp-2 mb-2 cursor-pointer"
                  >
                    {pName}
                  </h3>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>{t.modelsCount(product.sizevariants?.length || 1)}</span>
                    <span className={`font-bold px-2 py-0.5 rounded border inline-flex items-center gap-1 ${stockMeta.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${stockMeta.dotClass}`} />
                      <span>{stockMeta.shortLabel}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <button
                      onClick={() => setQuickViewProduct(product)}
                      className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1 shadow-xs ${
                        stockMeta.canOrder
                          ? 'bg-blue-900 hover:bg-blue-950 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <ShoppingCart size={14} /> {stockMeta.canOrder ? th.addToOrder : t.previewAlternatives}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleCompare(product)}
                      className={`p-2 border rounded-lg transition flex items-center justify-center ${
                        isInCompare(product.id)
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'border-gray-200 hover:border-blue-400 text-gray-500 hover:text-blue-900'
                      }`}
                      title={isInCompare(product.id) ? th.inCompareTitle : th.compareTitle}
                      aria-label={th.compareShort}
                    >
                      <Scale size={16} />
                    </button>
                    <button
                      onClick={() => toggleWishlist(product)}
                      className="p-2 border border-gray-200 hover:border-red-300 rounded-lg text-gray-400 hover:text-red-500 transition flex items-center justify-center"
                    >
                      <Heart size={16} className={isInWishlist(product.id) ? 'text-red-500 fill-red-500' : ''} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className={`bg-blue-900 text-white rounded-2xl p-6 ${isRtl ? 'text-right' : 'text-left'} flex flex-col lg:flex-row items-center justify-between gap-4`}>
        <div>
          <h3 className="text-lg font-bold">{t.wholesaleBannerTitle(brandName)}</h3>
          <p className="text-blue-100 text-sm mt-1">
            {t.wholesaleBannerSub}
          </p>
        </div>
        <a
          href="tel:15218"
          className="bg-yellow-400 hover:bg-yellow-300 text-blue-950 font-black px-6 py-3 rounded-xl text-sm shadow-lg transition inline-flex items-center gap-2"
        >
          <PhoneCall size={16} />
          <span>{t.contactSales}</span>
        </a>
      </div>
    </div>
  );
};
