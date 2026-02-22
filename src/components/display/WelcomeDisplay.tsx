"use client";

import { useState, useEffect } from "react";
import { AttendeeRosterDisplay } from "@/components/display/AttendeeRosterDisplay";
import { SocialWallSlide } from "@/components/display/SocialWallSlide";
import type { OnlinePlayer, SocialMessage, SocialPhoto } from "@/stores/game-store";

interface Attendee {
  id: string;
  display_name: string;
  status: string;
  user_id: string | null;
}

interface WelcomeDisplayProps {
  eventTitle: string;
  eventSlug: string;
  onlineCount: number;
  attendees: Attendee[];
  onlinePlayers: OnlinePlayer[];
  messages?: SocialMessage[];
  photos?: SocialPhoto[];
  legendaryScore?: number;
}

export function WelcomeDisplay({
  eventTitle,
  eventSlug,
  attendees,
  onlinePlayers,
  messages = [],
  photos = [],
  legendaryScore = 0,
}: WelcomeDisplayProps) {
  const hasSocialContent = messages.length > 0 || photos.length > 0;
  const [slide, setSlide] = useState<"roster" | "wall">("roster");

  useEffect(() => {
    if (!hasSocialContent) return;

    const interval = setInterval(() => {
      setSlide((prev) => (prev === "roster" ? "wall" : "roster"));
    }, 15_000);

    return () => clearInterval(interval);
  }, [hasSocialContent]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Roster Slide */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
          slide === "roster" || !hasSocialContent ? "opacity-100 z-10" : "opacity-0 z-0"
        }`}
      >
        <AttendeeRosterDisplay
          attendees={attendees}
          onlinePlayers={onlinePlayers}
          eventTitle={eventTitle}
          eventSlug={eventSlug}
        />
      </div>

      {/* Social Wall Slide */}
      {hasSocialContent && (
        <div
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            slide === "wall" ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <SocialWallSlide
            messages={messages}
            photos={photos}
            legendaryScore={legendaryScore}
            eventSlug={eventSlug}
          />
        </div>
      )}
    </div>
  );
}
