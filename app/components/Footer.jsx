

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-100 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Aura AI</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Хиймэл оюун ухааны тусламжтайгаар таны төрөлх гоо үзэсгэлэнг тодотгох төгс өнгийг олж өгнө.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
               
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
               
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
               
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Цэс</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Эхлэл</a></li>
              <li><a href="#how-it-works" className="hover:text-indigo-600 transition-colors">Хэрхэн ажилладаг вэ?</a></li>
              <li><a href="#pricing" className="hover:text-indigo-600 transition-colors">Үнийн санал</a></li>
              <li><a href="#faq" className="hover:text-indigo-600 transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Хууль эрх зүй</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Үйлчилгээний нөхцөл</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Нууцлалын бодлого</a></li>
              <li><a href="#" className="hover:text-indigo-600 transition-colors">Күүки бодлого</a></li>
            </ul>
          </div>

          {/* Contact & Newsletter */}
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Холбоо барих</h4>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
             
              <span>info@aura-ai.mn</span>
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-400 mb-2">Шинэ мэдээлэл хүлээн авах:</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Мэйл хаяг" 
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">
                  Илгээх
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-50 pt-8 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Aura AI. Бүх эрх хуулиар хамгаалагдсан.</p>
        </div>
      </div>
    </footer>
  );
}
