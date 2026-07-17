/**
 * 星露谷调色板系统
 *
 * 参考 Stardew Valley 的颜色系统，限定 256 色以内的暖色调
 * 所有 sprite 必须从这些颜色中选取
 */

// 基础调色板
export const PALETTE = {
  // 草地（春）
  grass_spring: ['#7CCB7C', '#5BAE5B', '#4A9A4A', '#3A8A3A'],
  grass_summer: ['#8FD16D', '#6FBE4D', '#5BAE3D', '#4F9E33'],
  grass_autumn: ['#D7A95E', '#C49647', '#B08438', '#9A7429'],
  grass_winter: ['#E8F1F2', '#C7DBE0', '#A8C0C8', '#8AA5AF'],

  // 土壤/泥土
  soil: ['#8B5A2B', '#704421', '#553318', '#3A2110'],
  soil_dark: ['#553318', '#3A2110', '#251510', '#150A05'],

  // 水
  water: ['#5BAEE0', '#4A9AC8', '#3A85AE', '#2A6F95'],

  // 天空
  sky_morning: '#9DC9E8',
  sky_day: '#7CB5E8',
  sky_sunset: '#F5A55E',
  sky_night: '#2A3550',

  // 木材
  wood: ['#A87B5E', '#8E664A', '#74513A', '#5A3F2E'],
  wood_light: ['#C49647', '#A87B5E', '#8E664A', '#74513A'],

  // 石头
  stone: ['#B8B8B8', '#909090', '#707070', '#505050'],
  stone_dark: ['#707070', '#505050', '#383838', '#202020'],

  // 角色肤色
  skin_light: ['#FFE0BD', '#F5C6A0', '#E8AC85', '#D89070'],
  skin_medium: ['#E8B796', '#D49E7C', '#C08868', '#A67458'],
  skin_dark: ['#A87B5E', '#8E664A', '#74513A', '#5A3F2E'],

  // 发色
  hair_blonde: ['#F5D67C', '#E0BD5E', '#C49A45', '#A37C32'],
  hair_brown: ['#7C4F2E', '#653C20', '#4F2C18', '#3A1F10'],
  hair_black: ['#3A2E25', '#2A1F18', '#1A130E', '#0A0805'],
  hair_white: ['#F0F0F0', '#D8D8D8', '#B8B8B8', '#909090'],
  hair_red: ['#D74030', '#B82820', '#981C18', '#781410'],

  // 衣服色
  shirt_red: ['#E74C3C', '#C0392B', '#96281B', '#6E1A0F'],
  shirt_blue: ['#5BAEE0', '#4A9AC8', '#3A85AE', '#2A6F95'],
  shirt_green: ['#7CCB7C', '#5BAE5B', '#4A9A4A', '#3A8A3A'],
  shirt_purple: ['#9B59B6', '#8E44AD', '#6C3483', '#4A235A'],
  shirt_yellow: ['#F1C40F', '#D4AC0D', '#9A7D0A', '#6E5707'],

  // UI 色
  panel_bg: '#F5E8D0',
  panel_border: '#8B5A2B',
  text_dark: '#3A2E25',
  text_light: '#F0E8D8',
} as const;

// 时段（影响全局色调）
export type TimeOfDay = 'morning' | 'day' | 'sunset' | 'night';

export const TIME_OVERLAYS: Record<TimeOfDay, string> = {
  morning: '#FFEFD580', // 暖黄
  day: '#FFFFFF00',     // 无叠加
  sunset: '#FF7F5080',  // 橘红
  night: '#1A205080',   // 深蓝
};

// 验证颜色是否在调色板中（开发时使用）
export function isValidPaletteColor(color: string): boolean {
  const upper = color.toUpperCase();
  for (const key of Object.keys(PALETTE)) {
    const val = (PALETTE as any)[key];
    if (typeof val === 'string') {
      if (val.toUpperCase() === upper) return true;
    } else if (Array.isArray(val)) {
      if (val.some((c) => c.toUpperCase() === upper)) return true;
    }
  }
  return false;
}
