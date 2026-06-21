'use client';

import { useT } from '@/i18n/context';
import { ClassicLoader } from '@/components/ui/ClassicLoader';
import { useStudioApp } from '@/lib/hooks/useStudioApp';
import { getPlanLabel, type PlanId } from '@/lib/plans';
import type { StudioSectionProps } from '@/types/studio';
import { StudioCreatePanel } from './StudioCreatePanel';
import { StudioErrorView } from './StudioErrorView';
import { StudioHeader } from './StudioHeader';
import { StudioIntroCard } from './StudioIntroCard';
import { StudioSidebar } from './StudioSidebar';
import { StudioWorkspace } from './StudioWorkspace';
import { studioFontClassName } from './studio-fonts';
import './studio-theme.css';

export function StudioSection({ mode, initialCredits = 1, plan = 'free' }: StudioSectionProps) {
  const { t } = useT();
  const planId = (plan === 'pro' || plan === 'banda' ? plan : 'free') as PlanId;
  const app = useStudioApp({ mode, initialCredits, plan: planId });

  if (!app.hydrated) {
    return (
      <div className={`studio-root studio-root--${mode} ${studioFontClassName}`}>
        <div className="canvas-center" style={{ minHeight: 320 }}>
          <ClassicLoader size="md" />
        </div>
      </div>
    );
  }

  return (
    <div className={`studio-root studio-root--${mode} ${studioFontClassName}`}>
      <div className="studio-body">
        <StudioHeader mode={mode} />
        <div className="studio-shell">
          <StudioSidebar
            songs={app.songs}
            activeId={app.activeId}
            remaining={app.credits}
            total={app.total}
            plan={planId}
            onOpen={app.openSong}
            onNew={app.startCreate}
          />
          <main className="studio-canvas">
            {app.view === 'intro' && <StudioIntroCard onStart={app.startCreate} />}
            {app.view === 'create' && (
              <StudioCreatePanel
                genre={app.genre}
                setGenre={app.setGenre}
                stems={app.stems}
                toggleStem={app.toggleStem}
                prompt={app.prompt}
                setPrompt={app.setPrompt}
                remaining={app.credits}
                generating={app.generating}
                onGenerate={() => void app.generate(t)}
              />
            )}
            {app.view === 'work' && app.activeSong && (
              <StudioWorkspace
                song={app.activeSong}
                onEditLyrics={app.editLyrics}
                onIterate={(p) => void app.iterate(p, t)}
                iterating={app.iterating}
                remaining={app.credits}
                savedFlash={app.savedFlash}
                mode={mode}
              />
            )}
            {app.view === 'error' && <StudioErrorView onBack={app.backFromError} />}
          </main>
        </div>
      </div>
      {mode === 'live' && (
        <span className="sr-only">{getPlanLabel(planId, t)}</span>
      )}
    </div>
  );
}
