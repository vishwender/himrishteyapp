import React from 'react';
import {StyleSheet} from 'react-native';
import {
  House, Search, Heart, UserRound, Bookmark, BookmarkCheck, Send,
  MapPin, GraduationCap, BriefcaseBusiness, ShieldCheck, Sparkles,
  Clock, Eye, EyeOff, SlidersHorizontal, ChevronRight, ChevronDown,
  ChevronUp, Pencil, Camera, LockKeyhole, Crown, Wallet, Settings,
  Trash2, LogOut, CalendarDays, Users, Leaf, Ruler, Check, X,
  Gift, ArrowDownLeft, ArrowUpRight, Circle, CircleCheck, Plus,
  UserRoundPlus, ListChecks,
} from 'lucide-react-native';
import colors from '../theme/colors';

const icons = {
  home: House, search: Search, heart: Heart, user: UserRound,
  bookmark: Bookmark, saved: BookmarkCheck, send: Send, location: MapPin,
  education: GraduationCap, work: BriefcaseBusiness, verified: ShieldCheck,
  sparkles: Sparkles, recent: Clock, eye: Eye, hidden: EyeOff,
  filters: SlidersHorizontal, next: ChevronRight, expand: ChevronDown,
  collapse: ChevronUp, edit: Pencil, camera: Camera, lock: LockKeyhole,
  crown: Crown, wallet: Wallet, settings: Settings, delete: Trash2,
  logout: LogOut, calendar: CalendarDays, family: Users, leaf: Leaf,
  height: Ruler, check: Check, close: X, gift: Gift,
  credit: ArrowDownLeft, debit: ArrowUpRight, circle: Circle,
  selected: CircleCheck, plus: Plus,
  recentlyJoined: UserRoundPlus, activities: ListChecks,
};

// Icons are decorative; their containing control owns its accessible label.
export default function AppIcon({name, size, color, style, filled = false}) {
  const flattened = StyleSheet.flatten(style) || {};
  const {fontSize, fontWeight, lineHeight, textAlign, color: styleColor, ...layout} = flattened;
  const Icon = icons[name] || Circle;
  return (
    <Icon
      size={size || fontSize || 20}
      color={color || styleColor || colors.primary}
      fill={filled ? color || styleColor || colors.primary : 'none'}
      strokeWidth={2}
      style={layout}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
