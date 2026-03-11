import React from "react";
import { PlayerColumn } from "./PlayerColumn";
import { usePlayerStore } from "../../store/usePlayerStore";

export const PlayerInfo: React.FC = () => {
  const columns = usePlayerStore((state) => state.columns);
  const removeColumn = usePlayerStore((state) => state.removeColumn);

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 text-white overflow-hidden">
      <div className="flex-1 flex space-x-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <PlayerColumn key={col.id} config={col} onRemove={() => removeColumn(col.id)} />
        ))}
      </div>
    </div>
  );
};
