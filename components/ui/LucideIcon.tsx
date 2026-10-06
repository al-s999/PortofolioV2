import { cn } from '@/lib/utils/cn';
import { forwardRef, ReactNode } from 'react';
import * as LucideIcons from 'lucide-react-native';
import { View, Text } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

type LucideIconName = keyof typeof LucideIcons;

interface LucideIconProps {
  name: LucideIconName;
  size?: number;
  color?: string;
  stroke?: string;
  strokeWidth?: number;
  fill?: string;
  className?: string;
  style?: any;
}

const iconCache: Record<string, any> = {};

function getFallbackIcon(name: string) {
  const fallbacks: Record<string, string> = {
    'Github': 'GitBranch',
    'Linkedin': 'User',
    'Twitter': 'MessageSquare',
    'Instagram': 'Camera',
    'Share2': 'Share',
    'Clock': 'Clock',
    'ChevronUp': 'ChevronUp',
    'ChevronDown': 'ChevronDown',
    'ChevronLeft': 'ChevronLeft',
    'ChevronRight': 'ChevronRight',
  };
  return fallbacks[name] || 'HelpCircle';
}

export const LucideIcon = forwardRef<any, LucideIconProps>(
  ({ name, size = 24, color, stroke, strokeWidth = 2, fill = 'none', className, style }, ref) => {
    const IconComponent = iconCache[name] || LucideIcons[name];
    const strokeColor = stroke ?? color ?? 'currentColor';
    
    if (!IconComponent) {
      const fallbackName = getFallbackIcon(name);
      const FallbackComponent = iconCache[fallbackName] || LucideIcons[fallbackName as keyof typeof LucideIcons] || LucideIcons.HelpCircle;
      iconCache[name] = FallbackComponent;
      
      return (
        <FallbackComponent
          ref={ref}
          size={size}
          stroke={strokeColor}
          fill={fill}
          strokeWidth={strokeWidth}
          className={className}
          style={style}
        />
      );
    }
    iconCache[name] = IconComponent;

    return (
      <IconComponent
        ref={ref}
        size={size}
        stroke={strokeColor}
        fill={fill}
        strokeWidth={strokeWidth}
        className={className}
        style={style}
      />
    );
  }
);

LucideIcon.displayName = 'LucideIcon';

export const Home = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Home" {...props} />;
export const User = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="User" {...props} />;
export const FolderGit2 = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="FolderGit2" {...props} />;
export const Mail = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Mail" {...props} />;
export const ArrowRight = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="ArrowRight" {...props} />;
export const Github = ({ size = 24, color, stroke, className, style }: Omit<LucideIconProps, 'name'>) => <FontAwesome6 name="github" size={size} color={color || stroke} style={style} className={className} />;
export const Linkedin = ({ size = 24, color, stroke, className, style }: Omit<LucideIconProps, 'name'>) => <FontAwesome6 name="linkedin" size={size} color={color || stroke} style={style} className={className} />;
export const Twitter = ({ size = 24, color, stroke, className, style }: Omit<LucideIconProps, 'name'>) => <FontAwesome6 name="twitter" size={size} color={color || stroke} style={style} className={className} />;
export const Instagram = ({ size = 24, color, stroke, className, style }: Omit<LucideIconProps, 'name'>) => <FontAwesome6 name="instagram" size={size} color={color || stroke} style={style} className={className} />;
export const WhatsApp = ({ size = 24, color, stroke, className, style }: Omit<LucideIconProps, 'name'>) => <FontAwesome6 name="whatsapp" size={size} color={color || stroke} style={style} className={className} />;
export const ExternalLink = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="ExternalLink" {...props} />;
export const Moon = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Moon" {...props} />;
export const Sun = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Sun" {...props} />;
export const ChevronDown = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="ChevronDown" {...props} />;
export const MapPin = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="MapPin" {...props} />;
export const Calendar = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Calendar" {...props} />;
export const Code2 = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Code2" {...props} />;
export const Award = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Award" {...props} />;
export const Heart = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Heart" {...props} />;
export const ChevronLeft = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="ChevronLeft" {...props} />;
export const ChevronRight = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="ChevronRight" {...props} />;
export const Filter = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Filter" {...props} />;
export const Search = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Search" {...props} />;
export const Phone = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Phone" {...props} />;
export const RefreshCw = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="RefreshCw" {...props} />;
export const Globe = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Globe" {...props} />;
export const Send = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Send" {...props} />;
export const Copy = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Copy" {...props} />;
export const Check = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Check" {...props} />;
export const Loader2 = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Loader2" {...props} />;
export const Eye = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Eye" {...props} />;
export const EyeOff = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="EyeOff" {...props} />;
export const Lock = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Lock" {...props} />;
export const Plus = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Plus" {...props} />;
export const Trash2 = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Trash2" {...props} />;
export const Edit2 = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Edit2" {...props} />;
export const Star = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Star" {...props} />;
export const StarOff = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="StarOff" {...props} />;
export const MoreVertical = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="MoreVertical" {...props} />;
export const Save = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Save" {...props} />;
export const ArrowLeft = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="ArrowLeft" {...props} />;
export const Image = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Image" {...props} />;
export const X = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="X" {...props} />;
export const TrendingUp = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="TrendingUp" {...props} />;
export const Settings = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Settings" {...props} />;
export const LogOut = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="LogOut" {...props} />;
export const Menu = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Menu" {...props} />;
export const LayoutDashboard = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="LayoutDashboard" {...props} />;
export const GripVertical = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="GripVertical" {...props} />;
export const AlertTriangle = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="AlertTriangle" {...props} />;
export const CheckCircle = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="CheckCircle" {...props} />;
export const AlertCircle = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="AlertCircle" {...props} />;
export const Info = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Info" {...props} />;
export const Share2 = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Share2" {...props} />;
export const Clock = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="Clock" {...props} />;
export const ChevronUp = (props: Omit<LucideIconProps, 'name'>) => <LucideIcon name="ChevronUp" {...props} />;