import { createFileRoute } from "@tanstack/react-router";

import { PlayerRoomView } from "@/components/game/PlayerRoomView";

const TITLE = "Your Seat in the WHIP Game Room — IP Quiz Board Game";
const DESCRIPTION =
  "Take your seat in this WHIP session: roll the dice, answer 30-second IP questions and follow the live board with the rest of the table.";

export const Route = createFileRoute("/$code/$slug")({
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
  component: SeatPage,
});

function SeatPage() {
  const { code, slug } = Route.useParams();
  return <PlayerRoomView code={code.toUpperCase()} slug={slug} />;
}
