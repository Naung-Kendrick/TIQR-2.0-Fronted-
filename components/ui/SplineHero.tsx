import { SplineScene } from '@/components/ui/splite';
import { Card } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';

export function SplineHero() {
  return (
    <Card className="w-full h-[500px] bg-black/[0.96] relative overflow-hidden border-[#1A1A1A]">
      <Spotlight size={320} />

      <div className="flex h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <p className="text-[10px] font-black text-[#737373] uppercase tracking-[0.3em] mb-4">
            Ta'ang Land · TIQR System
          </p>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight">
            Interactive<br />3D Engine
          </h1>
          <p className="mt-4 text-neutral-400 max-w-xs text-sm font-medium leading-relaxed">
            Sovereign identity platform powered by real-time QR generation and secure data pipelines.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-white animate-pulse" />
            <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
              System Live
            </span>
          </div>
        </div>

        {/* Right — 3D Spline scene */}
        <div className="flex-1 relative">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  );
}
