// =============================================================================
// @digipicks/ds — Public API
// Apps consume only what's exported here. Never import deep paths.
// =============================================================================

// ── utils ────────────────────────────────────────────────────────────────
export { cx } from './utils/cx';
export type { ClassValue } from './utils/cx';

// ── atoms ────────────────────────────────────────────────────────────────
export { Icon } from './components/atoms/Icon/Icon';
export type { IconName, IconProps } from './components/atoms/Icon/Icon';

export { Logo } from './components/atoms/Logo/Logo';
export { Avatar } from './components/atoms/Avatar/Avatar';
export type { AvatarProps } from './components/atoms/Avatar/Avatar';
export { AvatarStack } from './components/atoms/AvatarStack/AvatarStack';

export { Badge } from './components/atoms/Badge/Badge';
export type { BadgeProps, BadgeTone } from './components/atoms/Badge/Badge';
export { AccessBadge } from './components/atoms/AccessBadge/AccessBadge';
export { GradeBadge } from './components/atoms/GradeBadge/GradeBadge';
export { EventSourceBadge } from './components/atoms/EventSourceBadge/EventSourceBadge';
export type {
  EventSourceBadgeProps,
  EventSourceType,
} from './components/atoms/EventSourceBadge/EventSourceBadge';
export { VerifiedMark } from './components/atoms/VerifiedMark/VerifiedMark';
export { SportTag } from './components/atoms/SportTag/SportTag';
export { Tag } from './components/atoms/Tag/Tag';

export { SkipLink } from './components/atoms/SkipLink/SkipLink';
export type { SkipLinkProps } from './components/atoms/SkipLink/SkipLink';

export { Bar } from './components/atoms/Bar/Bar';
export { ConfidenceBar } from './components/atoms/ConfidenceBar/ConfidenceBar';
export { ConfidenceGauge } from './components/atoms/ConfidenceGauge/ConfidenceGauge';
export type { ConfidenceGaugeProps } from './components/atoms/ConfidenceGauge/ConfidenceGauge';
export { FormDots } from './components/atoms/FormDots/FormDots';
export { Sparkline } from './components/atoms/Sparkline/Sparkline';

export { Button } from './components/atoms/Button/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/atoms/Button/Button';
export { Chip } from './components/atoms/Chip/Chip';
export { Switch } from './components/atoms/Switch/Switch';
export { Checkbox } from './components/atoms/Checkbox/Checkbox';
export { Radio } from './components/atoms/Radio/Radio';
export { Kbd } from './components/atoms/Kbd/Kbd';
export { Odds } from './components/atoms/Odds/Odds';

// ── forms ────────────────────────────────────────────────────────────────
export { Input } from './components/forms/Input/Input';
export { TextArea } from './components/forms/TextArea/TextArea';
export { Select } from './components/forms/Select/Select';
export { Field } from './components/forms/Field/Field';
export { Search } from './components/forms/Search/Search';
export { FilterGroup } from './components/forms/FilterGroup/FilterGroup';
export { FilterRadio } from './components/forms/FilterRadio/FilterRadio';
export { FilterCheck } from './components/forms/FilterCheck/FilterCheck';
export { FilterChips } from './components/forms/FilterChips/FilterChips';
export type { FilterChipsProps, FilterChipsOption } from './components/forms/FilterChips/FilterChips';
export { SwitchRow } from './components/forms/SwitchRow/SwitchRow';
export type { SwitchRowProps } from './components/forms/SwitchRow/SwitchRow';
export { PasswordInput } from './components/forms/PasswordInput/PasswordInput';
export type { PasswordInputProps } from './components/forms/PasswordInput/PasswordInput';
export { AuthMethodButton, AuthSavedGroup } from './components/forms/AuthMethodButton/AuthMethodButton';
export type { AuthMethodButtonProps } from './components/forms/AuthMethodButton/AuthMethodButton';
export { EventForm } from './components/forms/EventForm/EventForm';
export type {
  EventFormProps,
  EventFormValue,
  EventFormVisibility,
} from './components/forms/EventForm/EventForm';

// ── surfaces ─────────────────────────────────────────────────────────────
export { Card } from './components/surfaces/Card/Card';
export { CardHead } from './components/surfaces/CardHead/CardHead';
export { Metric } from './components/surfaces/Metric/Metric';
export { EmptyState } from './components/surfaces/EmptyState/EmptyState';
export { Placeholder } from './components/surfaces/Placeholder/Placeholder';
export { LockedAnalysis } from './components/surfaces/LockedAnalysis/LockedAnalysis';
export { FeatureCard } from './components/surfaces/FeatureCard/FeatureCard';
export { Hero } from './components/surfaces/Hero/Hero';
export type { HeroProps, HeroTrustItem, HeroMarqueeItem } from './components/surfaces/Hero/Hero';
export { TrustMarquee } from './components/surfaces/TrustMarquee/TrustMarquee';
export { CTABanner } from './components/surfaces/CTABanner/CTABanner';
export { StepCard } from './components/surfaces/StepCard/StepCard';
export type { StepCardProps } from './components/surfaces/StepCard/StepCard';
export { Testimonial } from './components/surfaces/Testimonial/Testimonial';
export type { TestimonialProps } from './components/surfaces/Testimonial/Testimonial';
export { SplitCTA } from './components/surfaces/SplitCTA/SplitCTA';
export type { SplitCTAProps, SplitCTAPanel } from './components/surfaces/SplitCTA/SplitCTA';
export { PriceCard } from './components/surfaces/PriceCard/PriceCard';
export { AuthCard, AuthDivider, AuthFooterLink } from './components/surfaces/AuthCard/AuthCard';
export type { AuthCardProps } from './components/surfaces/AuthCard/AuthCard';
export { AISummary } from './components/surfaces/AISummary/AISummary';
export type { AISummaryProps } from './components/surfaces/AISummary/AISummary';

// ── data ─────────────────────────────────────────────────────────────────
export { Table, THead, TBody, Tr, Th, Td } from './components/data/Table/Table';
export { KV } from './components/data/KV/KV';
export { DataPair } from './components/data/DataPair/DataPair';
export { Stat } from './components/data/Stat/Stat';
export { BigStat } from './components/data/BigStat/BigStat';
export { OddsGrid } from './components/data/OddsGrid/OddsGrid';
export type {
  OddsGridProps,
  OddsRow,
  OddsCell,
  OddsBook,
} from './components/data/OddsGrid/OddsGrid';

// ── nav ──────────────────────────────────────────────────────────────────
export { AppHeader } from './components/nav/AppHeader/AppHeader';
export { Topbar } from './components/nav/Topbar/Topbar';
export { Sidebar } from './components/nav/Sidebar/Sidebar';
export { NavSection } from './components/nav/NavSection/NavSection';
export { NavItem } from './components/nav/NavItem/NavItem';
export { NavDivider } from './components/nav/NavDivider/NavDivider';
export { RoleSwitcher } from './components/nav/RoleSwitcher/RoleSwitcher';
export { ThemeToggle } from './components/nav/ThemeToggle/ThemeToggle';
export { ThemeIconButton } from './components/nav/ThemeIconButton/ThemeIconButton';
export { Segmented } from './components/nav/Segmented/Segmented';
export { Tabs } from './components/nav/Tabs/Tabs';
export { Breadcrumb } from './components/nav/Breadcrumb/Breadcrumb';

// ── layout ───────────────────────────────────────────────────────────────
export { AppLayout } from './components/layout/AppLayout/AppLayout';
export { PublicLayout } from './components/layout/PublicLayout/PublicLayout';
export { DashboardLayout } from './components/layout/DashboardLayout/DashboardLayout';
export { Container } from './components/layout/Container/Container';
export { Grid } from './components/layout/Grid/Grid';
export type { GridProps, GridGap } from './components/layout/Grid/Grid';
export { Heading } from './components/layout/Heading/Heading';
export type {
  HeadingProps,
  HeadingLevel,
  HeadingSize,
  HeadingTone,
  HeadingWeight,
} from './components/layout/Heading/Heading';
export { Section } from './components/layout/Section/Section';
export { PageHead } from './components/layout/PageHead/PageHead';
export { PageHeader } from './components/layout/PageHeader/PageHeader';
export type { PageHeaderProps, PageHeaderCrumb } from './components/layout/PageHeader/PageHeader';
export { TitleSub } from './components/layout/TitleSub/TitleSub';
export type { TitleSubProps } from './components/layout/TitleSub/TitleSub';
export { MetricGrid } from './components/layout/MetricGrid/MetricGrid';
export type { MetricGridProps, MetricGridItem } from './components/layout/MetricGrid/MetricGrid';
export { StatGrid } from './components/layout/StatGrid/StatGrid';
export type { StatGridProps, StatGridItem } from './components/layout/StatGrid/StatGrid';
export { Footer } from './components/layout/Footer/Footer';
export { Row } from './components/layout/Row/Row';
export { Col } from './components/layout/Col/Col';
export { Stack } from './components/layout/Stack/Stack';
export { Spacer } from './components/layout/Spacer/Spacer';
export { Divider } from './components/layout/Divider/Divider';
export { Eyebrow } from './components/layout/Eyebrow/Eyebrow';
export { Muted } from './components/layout/Muted/Muted';
export { Mono } from './components/layout/Mono/Mono';
export { Serif } from './components/layout/Serif/Serif';
export { AuthLayout, AuthAside } from './components/layout/AuthLayout/AuthLayout';
export type {
  AuthLayoutProps,
  AuthAsideProps,
  AuthAsideStat,
  AuthAsideTrust,
} from './components/layout/AuthLayout/AuthLayout';

// ── motion ───────────────────────────────────────────────────────────────
export { Reveal } from './components/motion/Reveal/Reveal';
export type { RevealProps, RevealDirection } from './components/motion/Reveal/Reveal';
export { Stagger, StaggerItem } from './components/motion/Stagger/Stagger';
export type { StaggerProps, StaggerItemProps } from './components/motion/Stagger/Stagger';

// ── feedback ─────────────────────────────────────────────────────────────
export { ResponsibleNote } from './components/feedback/ResponsibleNote/ResponsibleNote';
export { ResponsibleSection } from './components/feedback/ResponsibleSection/ResponsibleSection';
export type { ResponsibleSectionProps } from './components/feedback/ResponsibleSection/ResponsibleSection';
export { Accordion } from './components/feedback/Accordion/Accordion';
export { AccordionItem } from './components/feedback/AccordionItem/AccordionItem';
export { FAQList } from './components/feedback/FAQList/FAQList';
export { Modal } from './components/feedback/Modal/Modal';
export { Drawer } from './components/feedback/Drawer/Drawer';
export { Toast } from './components/feedback/Toast/Toast';
export {
  PushNotificationPrompt,
  type PushNotificationPromptProps,
  type PushPermissionState,
} from './components/feedback/PushNotificationPrompt/PushNotificationPrompt';

// ── domain ───────────────────────────────────────────────────────────────
export { CreatorChip } from './components/domain/CreatorChip/CreatorChip';
export { PersonRow } from './components/domain/PersonRow/PersonRow';
export type { PersonRowProps } from './components/domain/PersonRow/PersonRow';
export { HeroLivePanel } from './components/domain/HeroLivePanel/HeroLivePanel';
export type { HeroLiveEvent, HeroLivePanelProps } from './components/domain/HeroLivePanel/HeroLivePanel';
export { CreatorCard } from './components/domain/CreatorCard/CreatorCard';
export { EventCard } from './components/domain/EventCard/EventCard';
export type {
  EventCardProps,
  EventCardCreatorAvatar,
} from './components/domain/EventCard/EventCard';
export { PickCard } from './components/domain/PickCard/PickCard';
export { ChatPanel } from './components/domain/ChatPanel/ChatPanel';
export type {
  ChatPanelProps,
  ChatPanelMessage,
} from './components/domain/ChatPanel/ChatPanel';
export { StreamEmbed } from './components/domain/StreamEmbed/StreamEmbed';
export type {
  StreamEmbedProps,
  StreamPlatform,
} from './components/domain/StreamEmbed/StreamEmbed';
export { PricingModal } from './components/domain/PricingModal/PricingModal';
export type {
  PricingModalProps,
  PricingTier,
  PricingPlan,
} from './components/domain/PricingModal/PricingModal';
