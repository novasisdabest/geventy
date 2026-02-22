"use client";

import { useEffect } from "react";
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

interface SocialMessageInit {
  id: string;
  display_name: string;
  content: string;
  created_at: string;
}

interface SocialPhotoInit {
  id: string;
  display_name: string;
  url: string;
  created_at: string;
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
  initialMessages?: SocialMessageInit[];
  initialPhotos?: SocialPhotoInit[];
}

export function DisplayView({ event, attendees, initialAchievements, initialScore, initialMessages, initialPhotos }: DisplayViewProps) {
  const activeBlock = useGameStore((s) => s.activeBlock);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);
  const socialMessages = useGameStore((s) => s.socialMessages);
  const socialPhotos = useGameStore((s) => s.socialPhotos);
  const legendaryScore = useGameStore((s) => s.legendaryScore);

  useEffect(() => {
    if (initialAchievements && initialAchievements.length > 0) {
      useGameStore.getState().setAchievements(initialAchievements, initialScore ?? 0);
    }
  }, [initialAchievements, initialScore]);

  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      useGameStore.getState().setSocialMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    if (initialPhotos && initialPhotos.length > 0) {
      useGameStore.getState().setSocialPhotos(initialPhotos);
    }
  }, [initialPhotos]);

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
        messages={socialMessages}
        photos={socialPhotos}
        legendaryScore={legendaryScore}
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
