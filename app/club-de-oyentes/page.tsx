import ListenerClubForm from "./ListenerClubForm";
import { stations } from "@/data/stations";

export const dynamic = "force-dynamic";

export default function ListenerClubPage() {
  return (
    <ListenerClubForm
      stations={stations.map((station) => ({
        id: station.id,
        name: station.name,
      }))}
    />
  );
}
