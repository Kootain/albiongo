import os
import json

combat_events = [19]

if __name__ == '__main__':
    filtered_events = []
    with open('./data/albion_log_2026-03-14.jsonl', 'r', encoding='utf-8') as f:
        for line in f.readlines():
            data = json.loads(line.strip())
            if data['Type'] != 0 or data['Code'] not in combat_events:
                continue
            if data['CasterName'] != "Kootain":
                continue
            filtered_events.append(line)
        
    with open('./data/albion_log_2026-03-14_filtered_kootain.jsonl', 'w', encoding='utf-8') as f:
        f.writelines(filtered_events)