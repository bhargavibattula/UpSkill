import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side - Image & Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-brand-900">
        <Image
          src="/bg-gov.png"
          alt="Government Educational Building"
          fill
          sizes="50vw"
          className="object-cover opacity-40 mix-blend-overlay"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950 via-brand-900/60 to-transparent" />

        <div className="relative z-10 flex flex-col justify-end p-12 h-full text-white">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
              <img src="/favicon.svg" alt="Logo" className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide uppercase">Government of Andhra Pradesh</h2>
              <p className="text-brand-200 text-sm">Department of School Education</p>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold tracking-tight mb-4">
            Gnana Prakash
          </h1>
          <p className="text-xl text-brand-100 max-w-lg leading-relaxed">
            The unified Training Management & Monitoring System for empowering educators through continuous professional development.
          </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:px-12 sm:py-8 lg:px-24 lg:py-8 relative overflow-hidden">
        {/* Abstract Background for right side */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-brand-50 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-blue-50 blur-3xl opacity-50" />

        <div className="w-full max-w-md relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}
