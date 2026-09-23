import { useState } from 'react'
import { Wordmark, StitchLoader, IlkalBand } from '../../components/Patterns'
import { Button, Chip, Pill, Section, Sheet, Stat } from '../../components/ui'

export function KitPage() {
  const [chip1, setChip1] = useState(false)
  const [chip2, setChip2] = useState(true)
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <div className="min-h-dvh bg-hatti-50 pb-20 overflow-x-hidden">
      <IlkalBand className="w-full" />
      
      <div className="px-6 py-8 space-y-12 max-w-lg mx-auto">
        <header>
          <Wordmark />
          <p className="mt-4 text-kallu-800 text-lg leading-[1.6]">
            Bagalkot heritage companion design system. Thumb-friendly, fast, and distinctly local.
          </p>
        </header>

        <Section title="Buttons" kicker="TOUCH TARGETS">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Button size="lg" variant="primary">Primary Lg</Button>
              <Button size="md" variant="primary">Primary Md</Button>
              <Button size="sm" variant="primary">Sm</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
            <div className="flex flex-wrap gap-4">
              <Button variant="gold">Gold Action</Button>
              <Button variant="dark">Dark Action</Button>
            </div>
          </div>
        </Section>

        <Section title="Chips & Pills" kicker="CATEGORIES">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <Chip active={chip1} onClick={() => setChip1(!chip1)}>Architecture</Chip>
              <Chip active={chip2} onClick={() => setChip2(!chip2)}>Nature</Chip>
              <Chip active={false}>Spiritual</Chip>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Pill tone="neutral">Neutral</Pill>
              <Pill tone="red">Anchor</Pill>
              <Pill tone="gold">Major</Pill>
              <Pill tone="green">Verified</Pill>
              <Pill tone="indigo">Local</Pill>
              <Pill tone="dark">Demo</Pill>
            </div>
          </div>
        </Section>

        <Section title="Stats" kicker="DATA">
          <div className="grid grid-cols-2 gap-4">
            <Stat value="1,200" label="Years of history" />
            <Stat value="18" label="Local businesses" tone="text-hasiru-700" />
            <Stat value="22" label="Heritage sites" tone="text-arishina-600" />
            <Stat value="88" label="Crowd index" tone="text-neeli-700" />
          </div>
        </Section>

        <Section title="Overlays & Loaders" kicker="INTERACTION">
          <div className="flex flex-col items-start gap-8">
            <Button onClick={() => setSheetOpen(true)}>Open Bottom Sheet</Button>
            
            <div className="p-8 bg-white card rounded-3xl self-center shadow-sm">
              <StitchLoader />
            </div>
          </div>
        </Section>
      </div>

      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Kasuti Details">
        <div className="space-y-4 text-kallu-800 text-base leading-[1.6]">
          <p>
            Kasuti is a traditional form of folk embroidery originating from northern Karnataka. 
            The intricate patterns are created by counting the threads of the warp and weft, 
            meaning the designs are entirely stitched without tracing.
          </p>
          <p>
            Common motifs include temple chariots (ratha), palanquins, elephants, and complex star geometries like the one in our loader.
          </p>
          <Button className="w-full mt-4" onClick={() => setSheetOpen(false)}>Understood</Button>
        </div>
      </Sheet>
    </div>
  )
}
