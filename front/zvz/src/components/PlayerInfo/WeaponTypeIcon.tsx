import React from "react";
import { useTranslation } from "react-i18next";
import { Shield, Heart, HandHelping, Swords, Target, Circle } from "lucide-react";

interface WeaponTypeIconProps {
  type: string;
  size?: number;
}

export const WeaponTypeIcon: React.FC<WeaponTypeIconProps> = ({ type, size = 14 }) => {
  const { t } = useTranslation();

  switch (type) {
    case "坦克":
      return <Shield size={size} className="text-blue-400" title={t("Tank")} />;
    case "治疗":
      return <Heart size={size} className="text-green-400" title={t("Healer")} />;
    case "辅助":
      return <HandHelping size={size} className="text-orange-400" title={t("Support")} />;
    case "近战输出":
      return <Swords size={size} className="text-red-400" title={t("Melee DPS")} />;
    case "远程输出":
      return <Target size={size} className="text-red-400" title={t("Ranged DPS")} />;
    default:
      return <Circle size={size} className="text-zinc-500" />;
  }
};
