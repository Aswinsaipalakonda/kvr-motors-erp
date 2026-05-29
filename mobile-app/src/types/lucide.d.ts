declare module 'lucide-react-native' {
  import * as React from 'react';
  import { SvgProps } from 'react-native-svg';

  export interface LucideProps extends SvgProps {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
  }

  export type LucideIcon = React.ComponentType<LucideProps>;

  export const Home: LucideIcon;
  export const Landmark: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const UserCheck: LucideIcon;
  export const TrendingUp: LucideIcon;
  export const Wallet: LucideIcon;
  export const Car: LucideIcon;
  export const Users: LucideIcon;
  export const ChevronRight: LucideIcon;
  export const MapPin: LucideIcon;
  export const ArrowUpRight: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const CirclePercent: LucideIcon;
  export const Warehouse: LucideIcon;
  export const BatteryCharging: LucideIcon;
  export const Check: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const UserPlus: LucideIcon;
  export const PhoneCall: LucideIcon;
  export const Award: LucideIcon;
  export const Ban: LucideIcon;
  export const ArrowDownLeft: LucideIcon;
  export const Eye: LucideIcon;
  export const EyeOff: LucideIcon;
  export const Lock: LucideIcon;
  export const User: LucideIcon;
  export const CheckSquare: LucideIcon;
  export const Square: LucideIcon;
  export const Search: LucideIcon;
  export const SlidersHorizontal: LucideIcon;
  export const ChevronDown: LucideIcon;
  export const MoreVertical: LucideIcon;
  export const Zap: LucideIcon;
  export const Gauge: LucideIcon;
  export const Battery: LucideIcon;
  export const Star: LucideIcon;
  export const Sparkles: LucideIcon;
  export const Package: LucideIcon;
  export const Calendar: LucideIcon;
  export const CalendarDays: LucideIcon;
  export const X: LucideIcon;
  export const Layers: LucideIcon;
  export const ShoppingBag: LucideIcon;
}
