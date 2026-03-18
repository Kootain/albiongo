import React, { useRef, useState } from 'react';
import { useReplayStore } from '../../store/useReplayStore';
import { Upload } from 'lucide-react';

const CHUNK_SIZE = 1024 * 1024 * 5; // 5MB chunks
const TARGET_CODES = [19, 21, 6, 7, 9, 11, 165]; // Combat related codes

export const ImportLogButton: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { setEvents } = useReplayStore();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [summary, setSummary] = useState<string | null>(null);

  const onClick = () => inputRef.current?.click();

  const processChunk = async (file: File, offset: number, buffer: string): Promise<{ newOffset: number; newBuffer: string; events: any[]; totalLines: number }> => {
    const slice = file.slice(offset, offset + CHUNK_SIZE);
    const text = await slice.text();
    
    let raw = buffer + text;
    let newOffset = offset + CHUNK_SIZE;
    
    // If we are not at the end of the file, we need to find the last newline
    // and keep the remainder for the next chunk
    let lastNewlineIndex = raw.lastIndexOf('\n');
    let newBuffer = '';
    
    if (newOffset < file.size && lastNewlineIndex !== -1) {
      newBuffer = raw.substring(lastNewlineIndex + 1);
      raw = raw.substring(0, lastNewlineIndex);
    } else if (newOffset >= file.size) {
      // End of file
      newBuffer = '';
    }

    const lines = raw.split(/\r?\n/);
    const events: any[] = [];
    let totalLines = 0;

    for (const line of lines) {
      if (!line || !line.trim()) continue;
      totalLines++;
      
      // Fast string filtering before JSON.parse
      // Check for Code:19, Code:21, etc.
      // We check for "Code":X to be safe
      let isRelevant = false;
      for (const code of TARGET_CODES) {
        if (line.includes(`"Code":${code}`)) {
          isRelevant = true;
          break;
        }
      }

      if (!isRelevant) continue;

      try {
        const obj = JSON.parse(line);
        if (obj?.Type === 0 && TARGET_CODES.includes(obj?.Code)) {
           const ts = (obj.Ts ?? obj.ts) as number | undefined;
           if (!ts) continue;
           
           // Normalize event structure
           events.push({
             Type: obj.Type,
             Code: obj.Code,
             timestamp: ts,
             type: getEventType(obj.Code),
             sourceName: obj.CasterName || 'Unknown',
             targetName: undefined, // Will be filled for other events later
             details: {
               SpellIndex: obj.SpellIndex,
               Pos: obj.Pos,
               CasterObjectID: obj.CasterObjectID,
               TargetObjectID: obj.TargetObjectID,
               ...obj // Keep other fields
             },
           });
        }
      } catch {
        // Ignore parsing errors
      }
    }

    return { newOffset, newBuffer, events, totalLines };
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setProgress(0);
    setSummary(null);
    
    try {
      let offset = 0;
      let buffer = '';
      let allEvents: any[] = [];
      let totalProcessedLines = 0;

      while (offset < file.size) {
        const result = await processChunk(file, offset, buffer);
        offset = result.newOffset;
        buffer = result.newBuffer;
        allEvents = allEvents.concat(result.events);
        totalProcessedLines += result.totalLines;
        
        // Update progress
        setProgress(Math.min(100, Math.round((offset / file.size) * 100)));
        
        // Yield to UI thread to allow render updates
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      allEvents.sort((a, b) => a.timestamp - b.timestamp);
      
      if (allEvents.length > 0) {
        setEvents(allEvents);
      }
      
      setSummary(`Processed ${totalProcessedLines} lines, found ${allEvents.length} combat events`);
    } catch (err) {
      console.error(err);
      setSummary('Error reading file');
    } finally {
      setLoading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept=".jsonl,.log,.txt,application/json"
        className="hidden"
        onChange={onFileChange}
      />
      <button
        onClick={onClick}
        disabled={loading}
        className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg px-3 py-1.5 transition-colors`}
        title="Import JSONL Log"
      >
        <Upload size={16} />
        {loading ? `Importing ${progress}%` : 'Import Log'}
      </button>
      {summary && (
        <span className="text-xs text-zinc-400">{summary}</span>
      )}
    </div>
  );
};

const getEventType = (code: number): string => {
  switch (code) {
    case 19: return 'cast';
    case 21: return 'hit';
    case 6:
    case 7:
    case 9: return 'damage'; // or heal, depends on value
    case 11: return 'buff';
    case 165: return 'death';
    default: return 'unknown';
  }
};
