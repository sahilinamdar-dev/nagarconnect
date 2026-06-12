import Link from 'next/link';

// Platform landing page. No stock photos — pure design. The phone mockup
// shows dummy data so visitors instantly understand the flow.
// Per-tenant branding (corporator photo etc.) comes from admin settings later.

const ISSUES = [
  { icon: '🗑️', label: 'कचरा' },
  { icon: '💧', label: 'पाणी गळती' },
  { icon: '🕳️', label: 'खड्डे' },
  { icon: '🚰', label: 'ड्रेनेज' },
  { icon: '💡', label: 'पथदिवे' },
];

const STEPS = [
  { icon: '📸', title: 'फोटो काढा', en: 'Take a photo', desc: 'समस्येचा फोटो काढा — कचरा, खड्डे, गळती' },
  { icon: '📝', title: 'तक्रार नोंदवा', en: 'Register', desc: 'वस्ती व खूण निवडा. ३० सेकंदात, लॉगिनशिवाय!' },
  { icon: '🎫', title: 'क्रमांक मिळवा', en: 'Get ticket', desc: 'उदा. P14-2026-0042 — स्थिती कधीही तपासा' },
  { icon: '✅', title: 'काम पूर्ण', en: 'Resolved', desc: 'कार्यालय काम करते, तुम्हाला फोटोसह कळते' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-slate-800 overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-700 via-teal-600 to-emerald-600" />
        {/* decorative blobs */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full bg-amber-300/20 blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-5 pt-14 pb-20 grid md:grid-cols-2 gap-12 items-center text-white">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-1.5 text-sm font-medium">
              🙏 नमस्कार पुणेकर!
            </span>
            <h1 className="text-4xl sm:text-6xl font-extrabold leading-[1.1] tracking-tight">
              आपला<br />
              <span className="text-amber-300">नगरसेवक</span>
            </h1>
            <p className="text-lg text-teal-50/90 max-w-md">
              तुमच्या वस्तीतील समस्या — <b className="text-white">एका फोटोसह थेट नगरसेवक कार्यालयात.</b>
              <span className="block mt-1 text-sm text-teal-100/80">
                No app · No login · Works on any phone
              </span>
            </p>

            {/* issue chips */}
            <div className="flex flex-wrap gap-2">
              {ISSUES.map((i) => (
                <span
                  key={i.label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3.5 py-1.5 text-sm"
                >
                  {i.icon} {i.label}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/w/prabhag-14"
                className="rounded-2xl bg-amber-400 hover:bg-amber-300 text-teal-950 px-7 py-4 font-extrabold text-lg shadow-xl shadow-black/20 hover:-translate-y-0.5 transition-all"
              >
                तक्रार नोंदवा →
              </Link>
              <Link
                href="/status"
                className="rounded-2xl border-2 border-white/40 hover:bg-white/10 px-7 py-4 font-bold transition-colors"
              >
                स्थिती तपासा
              </Link>
            </div>
          </div>

          {/* phone mockup with dummy data */}
          <div className="relative mx-auto w-full max-w-xs">
            <div className="absolute -inset-6 bg-white/10 rounded-[3rem] blur-xl" />
            <div className="relative rounded-[2.5rem] bg-slate-900 p-3 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="rounded-[2rem] bg-white overflow-hidden">
                <div className="bg-teal-700 text-white px-4 py-3">
                  <p className="text-[10px] opacity-80">प्रभाग १४ · Prabhag 14</p>
                  <p className="font-bold text-sm">तक्रार नोंदवा</p>
                </div>
                <div className="p-4 space-y-3 text-slate-800">
                  <div className="h-20 rounded-xl bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center text-3xl">
                    📸
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500">
                    🕳️ रस्ता-खड्डे
                  </div>
                  <div className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-500">
                    📍 इंदिरा नगर — गणपती मंदिरासमोर
                  </div>
                  <div className="rounded-xl bg-teal-700 text-white text-center py-2.5 text-sm font-bold">
                    तक्रार पाठवा
                  </div>
                  <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-center">
                    <p className="text-[10px] text-emerald-700">तक्रार क्रमांक</p>
                    <p className="font-mono font-bold text-emerald-800 text-sm tracking-wider">
                      P14-2026-0042
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* wave divider */}
        <svg className="relative block w-full text-white" viewBox="0 0 1440 60" fill="currentColor" preserveAspectRatio="none">
          <path d="M0,30 C360,70 1080,-10 1440,30 L1440,60 L0,60 Z" />
        </svg>
      </section>

      {/* ── Stats band ── */}
      <section className="max-w-6xl mx-auto px-5 -mt-2">
        <div className="grid grid-cols-3 gap-4 rounded-3xl bg-white border border-slate-100 shadow-xl shadow-slate-200/50 p-6 sm:p-8 text-center">
          {[
            { v: '३० सेकंद', l: 'तक्रार नोंदवायला · to file' },
            { v: '१००% मोफत', l: 'नागरिकांसाठी · free for citizens' },
            { v: '२४×७', l: 'कधीही, कुठूनही · anytime' },
          ].map((s) => (
            <div key={s.v}>
              <p className="text-xl sm:text-3xl font-extrabold text-teal-700">{s.v}</p>
              <p className="mt-1 text-[11px] sm:text-sm text-slate-500">{s.l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="text-3xl font-extrabold text-center">
          कसे काम करते?
          <span className="block text-base font-medium text-slate-400 mt-1">How it works</span>
        </h2>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="group relative rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50 p-6 text-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
            >
              <span className="absolute top-4 left-5 w-7 h-7 rounded-full bg-teal-700 text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-5xl group-hover:scale-110 transition-transform">{s.icon}</p>
              <h3 className="mt-4 font-bold text-lg">{s.title}</h3>
              <p className="text-xs text-slate-400">{s.en}</p>
              <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Example ticket (dummy data) ── */}
      <section className="bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-5 py-16">
          <h2 className="text-3xl font-extrabold text-center">
            उदाहरण पहा
            <span className="block text-base font-medium text-slate-400 mt-1">A real-life example</span>
          </h2>
          <div className="mt-10 max-w-2xl mx-auto rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-teal-700 to-emerald-600 text-white flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono font-bold tracking-widest">P14-2026-0042</span>
              <span className="px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 text-xs font-extrabold">
                ✓ सोडवली · Resolved
              </span>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-orange-100 p-5 text-center">
                <p className="text-4xl">🕳️</p>
                <p className="mt-2 font-bold text-slate-700">आधी · Before</p>
                <p className="text-xs text-slate-500 mt-1">मोठा खड्डा, पावसाळ्यात पाणी साचते</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 p-5 text-center">
                <p className="text-4xl">🛣️</p>
                <p className="mt-2 font-bold text-slate-700">नंतर · After</p>
                <p className="text-xs text-slate-500 mt-1">४८ तासांत खड्डा बुजवला</p>
              </div>
            </div>
            <div className="px-6 pb-5 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-600">
              <span>🔧 रस्ता-खड्डे</span>
              <span>📍 इंदिरा नगर — गणपती मंदिरासमोर</span>
              <span className="text-xs text-slate-400 w-full">* नमुना डेटा · sample data for illustration</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-6xl mx-auto px-5 py-16 text-center">
        <h2 className="text-3xl font-extrabold">
          तुमच्या वस्तीत समस्या आहे?
        </h2>
        <p className="mt-2 text-slate-500">आत्ताच नोंदवा — तुमचा आवाज कार्यालयापर्यंत पोहोचवा.</p>
        <Link
          href="/w/prabhag-14"
          className="mt-6 inline-block rounded-2xl bg-teal-700 hover:bg-teal-800 text-white px-10 py-4 font-extrabold text-lg shadow-xl shadow-teal-700/25 hover:-translate-y-0.5 transition-all"
        >
          तक्रार नोंदवा · Register complaint →
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-500">
          <p className="font-bold text-slate-700">🙏 आपला नगरसेवक</p>
          <div className="flex gap-6">
            <Link href="/status" className="hover:text-teal-700">स्थिती तपासा</Link>
            <Link href="/admin/login" className="hover:text-teal-700">कार्यालय लॉगिन</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
