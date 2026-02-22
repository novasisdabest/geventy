"use client";

import { useEventChannel } from "@/hooks/useEventChannel";
import { useGameStore } from "@/stores/game-store";
import { WelcomeDisplay } from "@/components/display/WelcomeDisplay";
import { GameDisplay } from "@/components/display/GameDisplay";
import { SlideshowDisplay } from "@/components/display/SlideshowDisplay";
import { MessageWallDisplay } from "@/components/display/MessageWallDisplay";
import { CustomBlockDisplay } from "@/components/display/CustomBlockDisplay";
import { LegendaryDisplay } from "@/components/display/LegendaryDisplay";

interface Attendee {
  id: string;
  display_name: string;
  status: string;
  user_id: string | null;
}

interface AchievementInit {
  id: string;
  achievement_type: string;
  title: string;
  points: number;
  awarded_at: string;
}

interface DisplayViewProps {
  event: {
    id: string;
    slug: string;
    title: string;
  };
  attendees: Attendee[];
  initialAchievements?: AchievementInit[];
  initialScore?: number;
}

export function DisplayView({ event, attendees, initialAchievements, initialScore }: DisplayViewProps) {
  const activeBlock = useGameStore((s) => s.activeBlock);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);

  // Hydrate achievements on mount
  const hasHydrated = useGameStore((s) => s.achievements.length > 0 || s.legendaryScore > 0);
  if (!hasHydrated && initialAchievements && initialAchievements.length > 0) {
    useGameStore.getState().setAchievements(initialAchievements, initialScore ?? 0);
  }

  useEventChannel({
    eventId: event.id,
    attendeeId: `display-${event.id.slice(0, 8)}`,
    displayName: "Projektor",
    isDisplay: true,
  });

  if (!activeBlock) {
    return (
      <WelcomeDisplay
        eventTitle={event.title}
        eventSlug={event.slug}
        onlineCount={onlinePlayers.filter((p) => !p.is_display).length}
        attendees={attendees}
        onlinePlayers={onlinePlayers}
      />
    );
  }

  switch (activeBlock.type) {
    case "game":
      return <GameDisplay block={activeBlock} eventSlug={event.slug} />;
    case "slideshow":
      return <SlideshowDisplay block={activeBlock} />;
    case "message_wall":
      return <MessageWallDisplay block={activeBlock} />;
    case "legendary":
      return <LegendaryDisplay eventTitle={event.title} />;
    case "custom":
      return <CustomBlockDisplay block={activeBlock} />;
    default:
      return <CustomBlockDisplay block={activeBlock} />;
  }
}
