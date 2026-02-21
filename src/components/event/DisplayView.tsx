"use client";

import { useEventChannel } from "@/hooks/useEventChannel";
import { useGameStore } from "@/stores/game-store";
import { WelcomeDisplay } from "@/components/display/WelcomeDisplay";
import { GameDisplay } from "@/components/display/GameDisplay";
import { SlideshowDisplay } from "@/components/display/SlideshowDisplay";
import { MessageWallDisplay } from "@/components/display/MessageWallDisplay";
import { CustomBlockDisplay } from "@/components/display/CustomBlockDisplay";

interface DisplayViewProps {
  event: {
    id: string;
    slug: string;
    title: string;
  };
}

export function DisplayView({ event }: DisplayViewProps) {
  const activeBlock = useGameStore((s) => s.activeBlock);
  const onlinePlayers = useGameStore((s) => s.onlinePlayers);

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
    case "custom":
      return <CustomBlockDisplay block={activeBlock} />;
    default:
      return <CustomBlockDisplay block={activeBlock} />;
  }
}
