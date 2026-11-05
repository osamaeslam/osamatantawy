import React from 'react';
import { HelpCircle, ChevronDown, MessageCircle, Truck, ShieldCheck, Wallet } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  icon: React.ReactNode;
}

const ITEMS: FaqItem[] = [
  {
    q: 'الأسعار مش ظاهرة… إزاي أعرف سعر الصنف؟',
    a: 'الكتالوج كتالوج جملة والأسعار بتتغير مع السوق، فبنبعتلك عرض السعر بعد ما تحدد الأصناف والكميات. ابعت كود الصنف (ITM) أو اسمه على واتساب أو من زر «استفسار عن منتج» فوق، وهنبعتلك السعر النهائي وإجمالي الفاتورة.',
    icon: <Wallet size={16} />,
  },
  {
    q: 'الدفع بيتم إزاي؟',
    a: 'الدفع عند الاستلام بعد الفحص والمعاينة، ومعاك كارت فاتورة معتمد. مفيش أي دفع مقدم للأصناف المتاحة.',
    icon: <ShieldCheck size={16} />,
  },
  {
    q: 'التوصيل بيوصل فين وكام يوم؟',
    a: 'بنشحن لجميع محافظات مصر. المدة عادةً من يومين إلى 7 أيام عمل حسب المحافظة، وبنتواصل معاك لتأكيد العنوان والموعد قبل خروج الشحنة.',
    icon: <Truck size={16} />,
  },
  {
    q: 'في أقل كمية للطلب (حد أدنى)؟',
    a: 'إحنا بنبيع جملة، فالأسعار والكميات بتتحدد حسب الصنف. ابعت الكميات المطلوبة على واتساب وفريق المبيعات هيقولك أفضل سعر متاح.',
    icon: <Wallet size={16} />,
  },
  {
    q: 'الصنف اللي بدور عليه مش موجود في الكتالوج؟',
    a: 'اكتب لنا اسمه وصورته من زر «بندور على صنف مش موجود» في مركز خدمة العملاء، وفريق المشتريات بيراجعه وبيبلغك أول ما يتوفر.',
    icon: <MessageCircle size={16} />,
  },
  {
    q: 'فيه ضمان؟ وإيه الوضع لو الصنف وصل تالف؟',
    a: 'الضمان حسب الصنف والوكيل ومكتوب على الفاتورة. ولو وصلك صنف تالف أو مخالف، بترفض الاستلام أو تبلغنا في نفس اليوم وبنستبدله على حسابنا.',
    icon: <ShieldCheck size={16} />,
  },
];

/** قسم الأسئلة الشائعة — بيقلل المكالمات المتكررة وبيحسّن الشفافية */
export const FAQSection: React.FC = () => {
  return (
    <section id="faq" className="mt-10 scroll-mt-24">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 sm:px-6 py-4 bg-gradient-to-l from-blue-950 to-blue-900 text-white flex items-center gap-2.5">
          <HelpCircle size={20} className="text-yellow-400" />
          <div>
            <h2 className="text-base sm:text-lg font-black">أسئلة شائعة</h2>
            <p className="text-[11px] text-blue-200">أكتر 6 أسئلة بتتكرر على خدمة العملاء</p>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {ITEMS.map((item) => (
            <details key={item.q} className="group px-5 sm:px-6 py-3.5 open:bg-blue-50/40 transition">
              <summary className="flex items-center gap-2.5 cursor-pointer list-none text-right">
                <span className="w-7 h-7 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
                  {item.icon}
                </span>
                <span className="flex-1 text-[13px] sm:text-sm font-black text-gray-900">{item.q}</span>
                <ChevronDown
                  size={16}
                  className="text-gray-400 group-open:rotate-180 transition shrink-0"
                />
              </summary>
              <p className="mt-2 pr-9 text-xs sm:text-[13px] text-gray-600 leading-relaxed font-medium">
                {item.a}
              </p>
            </details>
          ))}
        </div>

        <div className="px-5 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-500 font-bold">
            سؤالك مش هنا؟ اضغط زر خدمة العملاء العائم تحت، أو كلمنا على الخط الساخن.
          </p>
        </div>
      </div>
    </section>
  );
};
