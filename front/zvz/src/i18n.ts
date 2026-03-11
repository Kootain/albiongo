import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "Skill Monitor": "Skill Monitor",
      "Player Info": "Player Info",
      Rows: "Rows",
      Columns: "Columns",
      Apply: "Apply",
      Assignments: "Assignments",
      Delete: "Delete",
      "Add Column": "Add Column",
      Guild: "Guild",
      Alliance: "Alliance",
      "Search Player": "Search Player",
      "Search Alliance": "Search Alliance",
      "Player Name": "Player Name",
      Weapon: "Weapon",
      "Configure Monitor": "Configure Monitor",
      "Assign to Block": "Assign to Block",
      "Select Spell": "Select Spell",
      "Select Block": "Select Block",
      Close: "Close",
      "No assignments": "No assignments",
      Language: "Language",
    },
  },
  zh: {
    translation: {
      "Skill Monitor": "技能释放监控",
      "Player Info": "玩家信息展示",
      Rows: "行数",
      Columns: "列数",
      Apply: "应用",
      Assignments: "已配置技能",
      Delete: "删除",
      "Add Column": "新增列",
      Guild: "公会",
      Alliance: "联盟",
      "Search Player": "搜索玩家",
      "Search Alliance": "搜索联盟",
      "Player Name": "玩家名称",
      Weapon: "武器",
      "Configure Monitor": "配置监控",
      "Assign to Block": "分配到色块",
      "Select Spell": "选择技能",
      "Select Block": "选择色块",
      Close: "关闭",
      "No assignments": "暂无配置",
      Language: "语言",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "zh",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
