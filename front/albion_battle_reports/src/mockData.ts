import { AvalonBattlePerformance, PlayerBattleSummary, PlayerInfo } from './types';

const WEAPONS = [
  'T8_MAIN_SWORD',
  'T7_MAIN_BOW',
  'T8_2H_HALBERD',
  'T6_MAIN_FROSTSTAFF',
  'T8_2H_NATURESTAFF',
];

const generatePlayer = (name: string, isMain: boolean = false): PlayerInfo => {
  const weapon = WEAPONS[Math.floor(Math.random() * WEAPONS.length)];
  return {
    ID: Math.random().toString(36).substring(7),
    Name: name,
    AverageItemPower: 1200 + Math.random() * 300,
    Equipment: {
      MainHand: { Type: weapon, Count: 1, Quality: 3 },
    },
    Inventory: null,
    GuildName: 'Test Guild',
    GuildID: 'guild123',
    AllianceName: 'Test Alliance',
    AllianceID: 'alliance123',
    AllianceTag: 'TEST',
    Avatar: '',
    AvatarRing: '',
    DeathFame: 1000000,
    KillFame: 5000000,
    FameRatio: 5.0,
    LifetimeStatistics: null,
  };
};

export const generateMockData = (playerName: string): AvalonBattlePerformance => {
  const battleCnt = 20;
  const winCnt = Math.floor(Math.random() * 10) + 10; // 10-20 wins
  const loseCnt = battleCnt - winCnt;
  
  const records: PlayerBattleSummary[] = Array.from({ length: battleCnt }).map((_, i) => {
    const isWin = i < winCnt;
    const teamMembers = Array.from({ length: 4 }).map((_, j) => generatePlayer(`Teammate_${j + 1}`));
    const player = generatePlayer(playerName, true);
    
    // Ensure the main player has a specific weapon to show in pie chart
    // We'll bias towards a couple of weapons
    if (i % 3 === 0) player.Equipment.MainHand = { Type: 'T8_MAIN_SWORD', Count: 1, Quality: 3 };
    else if (i % 3 === 1) player.Equipment.MainHand = { Type: 'T7_MAIN_BOW', Count: 1, Quality: 3 };
    
    return {
      Kills: Math.floor(Math.random() * 5),
      Deaths: isWin ? Math.floor(Math.random() * 2) : Math.floor(Math.random() * 3) + 1,
      TeamKills: Math.floor(Math.random() * 15) + 5,
      TeamDeaths: isWin ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 15) + 5,
      TeamMembers: teamMembers,
      Player: player,
      StartTime: new Date(Date.now() - i * 86400000).toISOString(), // Past days
      BattleID: 1000000 + i,
    };
  });

  // Sort by time descending
  records.sort((a, b) => new Date(b.StartTime).getTime() - new Date(a.StartTime).getTime());

  let totalKills = 0, totalDeaths = 0, totalTeamKills = 0, totalTeamDeaths = 0;
  records.forEach(r => {
    totalKills += r.Kills;
    totalDeaths += r.Deaths;
    totalTeamKills += r.TeamKills;
    totalTeamDeaths += r.TeamDeaths;
  });

  return {
    PlayerName: playerName,
    BattleCnt: battleCnt,
    WinCnt: winCnt,
    LoseCnt: loseCnt,
    TeamKills: totalTeamKills,
    TeamDeaths: totalTeamDeaths,
    Kills: totalKills,
    Deaths: totalDeaths,
    BattleRecords: records,
  };
};
