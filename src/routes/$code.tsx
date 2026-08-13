import { createFileRoute } from "@tanstack/react-router";

import { PlayerRoomView } from "@/components/game/PlayerRoomView";

const TITLE = "Join a Rakuten FLIP Game Room — Live IP Quiz Board Game";
const DESCRIPTION =
  "Enter a Rakuten FLIP game room to play the IP awareness board game live: roll the on-screen dice, answer timed questions and chat with the table.";

export const Route = createFileRoute("/$code")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoomPage,
});

function RoomPage() {
  const { code } = Route.useParams();
  return <PlayerRoomView code={code.toUpperCase()} />;
}
