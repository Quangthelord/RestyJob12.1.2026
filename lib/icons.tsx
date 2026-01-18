import { 
  Search, 
  Shield, 
  BarChart3, 
  CreditCard,
  UtensilsCrossed,
  ChefHat,
  Truck,
  ShoppingBag,
  Briefcase,
  HardHat,
  Globe,
  Sun,
  SunMoon,
  Moon,
  Sunrise,
  Zap,
  Calendar,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Users,
  Building2,
  Sparkles,
  Filter,
  CheckCircle2,
  Flame,
  TrendingUp,
  CheckCircle
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

// Icon mapping for F&B/Hospitality industry
export const iconMap: Record<string, LucideIcon> = {
  // Core features
  'search': Search,
  'shield': Shield,
  'chart': BarChart3,
  'payment': CreditCard,
  
  // Job types - F&B/Hospitality
  'serving': UtensilsCrossed,      // Phục vụ
  'chef': ChefHat,                 // Bếp
  'delivery': Truck,               // Giao hàng
  'retail': ShoppingBag,           // Bán hàng/PG
  'office': Briefcase,             // Văn phòng
  'labor': HardHat,                // Lao động phổ thông
  
  // Time/Shifts
  'globe': Globe,
  'morning': Sunrise,              // Sáng
  'afternoon': Sun,                // Chiều
  'evening': SunMoon,              // Tối
  'night': Moon,                   // Đêm
  
  // Payment
  'immediate': Zap,                // Trả ngay
  'weekly': Calendar,              // Theo tuần
  'monthly': DollarSign,           // Theo tháng
  
  // Trust/Quality
  'star': Star,
  'verified': CheckCircle2,
  'urgent': Flame,
  
  // General
  'clock': Clock,
  'location': MapPin,
  'users': Users,
  'business': Building2,
  'ai': Sparkles,
  'filter': Filter,
  'check': CheckCircle,
  'trending': TrendingUp,
}

// Helper component for icon rendering
export function getIcon(name: string): LucideIcon {
  return iconMap[name] || Search
}


