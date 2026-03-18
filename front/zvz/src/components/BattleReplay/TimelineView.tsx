import React, { useEffect, useRef } from 'react';
import { Timeline, TimelineOptions } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.css';
import { useReplayStore } from '../../store/useReplayStore';
import { DataSet } from 'vis-data';
import moment from 'moment';

export const TimelineView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<Timeline | null>(null);
  const { events, selectEvent, currentTime, setCurrentTime, isPlaying, speed, filters, players } = useReplayStore();

  useEffect(() => {
    if (!containerRef.current || !events.length) return;

    // Filter events based on active filters
    const filteredEvents = events.filter(event => {
      // 1. Guild Filter
      if (filters.guilds.length > 0) {
        const sourcePlayer = players[event.sourceName || ''];
        const targetPlayer = players[event.targetName || ''];
        const sourceGuild = sourcePlayer?.GuildName;
        const targetGuild = targetPlayer?.GuildName;
        
        // Match if either source or target belongs to the selected guild
        const sourceMatch = sourceGuild && filters.guilds.includes(sourceGuild);
        const targetMatch = targetGuild && filters.guilds.includes(targetGuild);
        
        if (!sourceMatch && !targetMatch) return false;
      }

      // 2. Player Filter (by name)
      if (filters.players.length > 0) {
        const sourceMatch = event.sourceName && filters.players.includes(event.sourceName);
        const targetMatch = event.targetName && filters.players.includes(event.targetName);
        if (!sourceMatch && !targetMatch) return false;
      }

      // 3. Weapon Filter (requires looking up player equipment)
      // This is a placeholder as weapon mapping is complex
      if (filters.weapons.length > 0) {
         // Logic to check if source/target has the weapon
         return true; // Mock: pass for now
      }

      return true;
    });

    // Transform events to timeline items
    const items = new DataSet(
      filteredEvents.map((event, index) => ({
        id: index, // Use unique ID if available, index is risky with filtering but ok for display
        content: formatEventContent(event),
        start: event.timestamp,
        className: getEventClass(event.type),
        // group: event.type, // Group removed as per requirement
        data: event // Store full event data
      }))
    );

    const options: TimelineOptions = {
      stack: true, // Allow stacking
      verticalScroll: true,
      zoomKey: 'ctrlKey',
      start: events[0].timestamp,
      end: events[events.length - 1].timestamp,
      editable: false,
      align: 'left',
      orientation: 'top',
      maxHeight: '100%',
      minHeight: '300px',
      timeAxis: {
        scale: 'millisecond'
      },
      template: (item: any) => {
        return `<div class="p-1 text-xs font-mono truncate" title="${item.content}">${item.content}</div>`;
      }
    };

    if (timelineRef.current) {
      timelineRef.current.destroy();
    }

    // Initialize timeline without groups
    timelineRef.current = new Timeline(containerRef.current, items, options);

    // Event listeners
    timelineRef.current.on('select', (props) => {
      if (props.items.length > 0) {
        const selectedId = props.items[0];
        const item = items.get(selectedId);
        if (item) {
          // Cast to any because vis-data types might not infer the custom 'data' property
          selectEvent((item as any).data);
        }
      } else {
        selectEvent(null);
      }
    });

    timelineRef.current.on('timechange', (props) => {
        setCurrentTime(props.time.getTime());
    });

    return () => {
      if (timelineRef.current) {
        timelineRef.current.destroy();
        timelineRef.current = null;
      }
    };
  }, [events, selectEvent, setCurrentTime, filters, players]); // Added filters and players dependencies

  // Handle playback (simple mock implementation)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timelineRef.current) {
        // Move custom time bar or window
        interval = setInterval(() => {
            const nextTime = Date.now(); // Mock update
            setCurrentTime(nextTime); 
            timelineRef.current?.setCustomTime(nextTime, 't1');
            timelineRef.current?.moveTo(nextTime); // Follow the playhead
        }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, setCurrentTime]);

  return <div ref={containerRef} className="w-full h-full bg-zinc-900 rounded-xl border border-zinc-800 shadow-sm" />;
};

// Helper functions for styling
const getEventClass = (type: string) => {
  switch (type) {
    case 'cast': return 'bg-blue-500/20 border-blue-500 text-blue-200';
    case 'hit': return 'bg-yellow-500/20 border-yellow-500 text-yellow-200';
    case 'damage': return 'bg-red-500/20 border-red-500 text-red-200';
    case 'heal': return 'bg-green-500/20 border-green-500 text-green-200';
    case 'death': return 'bg-zinc-700 border-zinc-500 text-zinc-300 font-bold';
    default: return 'bg-zinc-800 border-zinc-600';
  }
};

const formatEventContent = (event: any) => {
  return `${event.sourceName || 'Unknown'} -> ${event.targetName || 'Self'} (${event.type})`;
};
