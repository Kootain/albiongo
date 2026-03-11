import React from "react";
import { useMonitorStore } from "../../store/useMonitorStore";
import { ColorBlock } from "./ColorBlock";

export const SkillMonitor: React.FC = () => {
  const { rows, cols, blocks } = useMonitorStore();

  return (
    <div className="flex flex-col h-full bg-zinc-950 p-6 text-white">
      <div
        className="flex-1 grid gap-4"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridAutoRows: `minmax(0, 1fr)`,
        }}
      >
        {blocks.map((block) => (
          <ColorBlock key={block.id} blockId={block.id} />
        ))}
      </div>
    </div>
  );
};
