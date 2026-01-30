// Auto-generated from schema files
// Run: node scripts/gen-types.mjs

export interface AlertOptions {
  variant?: string;
  title?: string;
  message?: string;
  icon?: string;
  dismissible?: boolean;
}

export interface ArticleOptions {
  title?: string;
  subtitle?: string;
  author?: string;
  date?: string;
  category?: string;
  image?: string;
  imageAlt?: string;
  readingTime?: string;
  featured?: boolean;
}

export interface ArticlesOptions {
  layout?: string;
  columns?: number;
  limit?: number;
  source?: string;
  pagination?: boolean;
}

export interface AudioOptions {
  src?: string;
  volume?: number;
  loop?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  showEq?: boolean;
  bass?: number;
  treble?: number;
}

export interface AvatarOptions {
  src?: string;
  alt?: string;
  initials?: string;
  name?: string;
  size?: string;
  shape?: string;
  status?: string;
  bordered?: boolean;
}

export interface BadgeOptions {
  label?: string;
  variant?: string;
  size?: string;
  pill?: boolean;
  dot?: boolean;
  outline?: boolean;
  removable?: boolean;
}

export interface BehaviorOptions {
}

export interface Behaviors_showcaseOptions {
}

export interface Builder_pagesOptions {
  pages?: any;
  globalSections?: any;
  currentPageId?: string;
  settings?: any;
}

export interface BuilderOptions {
  label?: string;
  icon?: string;
  components?: any;
  meta?: any;
}

export interface ButtonOptions {
  label?: string;
  icon?: string;
  iconPosition?: string;
  variant?: string;
  size?: string;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  iconOnly?: boolean;
}

export interface Card_baseOptions {
  title?: string;
  subtitle?: string;
  footer?: string;
  variant?: string;
  clickable?: boolean;
  hoverable?: boolean;
  elevated?: boolean;
  size?: string;
}

export interface CardOptions {
  title?: string;
  subtitle?: string;
  footer?: string;
  elevated?: boolean;
  clickable?: boolean;
  variant?: string;
  size?: string;
}

export interface CardbuttonOptions {
  title?: string;
  content?: string;
  primary?: string;
  primaryHref?: string;
  secondary?: string;
  secondaryHref?: string;
  variant?: string;
}

export interface CarddraggableOptions {
  title?: string;
  content?: string;
  constrain?: string;
  axis?: string;
  snapToGrid?: number;
  variant?: string;
}

export interface CardexpandableOptions {
  title?: string;
  content?: string;
  expanded?: boolean;
  maxHeight?: string;
  variant?: string;
}

export interface CardfileOptions {
  filename?: string;
  fileType?: string;
  size?: string;
  date?: string;
  href?: string;
  downloadable?: boolean;
  variant?: string;
}

export interface CardheroOptions {
  background?: string;
  title?: string;
  subtitle?: string;
  cta?: string;
  ctaHref?: string;
  variant?: string;
  xalign?: string;
  overlay?: boolean;
  fullHeight?: boolean;
}

export interface CardhorizontalOptions {
  image?: string;
  imageAlt?: string;
  imagePosition?: string;
  imageWidth?: string;
  title?: string;
  subtitle?: string;
  variant?: string;
}

export interface CardimageOptions {
  src?: string;
  alt?: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  href?: string;
  aspect?: string;
  position?: string;
  fit?: string;
  loading?: string;
  variant?: string;
}

export interface CardlinkOptions {
  href?: string;
  title?: string;
  description?: string;
  icon?: string;
  badge?: string;
  target?: string;
  variant?: string;
}

export interface CardminimizableOptions {
  title?: string;
  content?: string;
  minimized?: boolean;
  variant?: string;
}

export interface CardnotificationOptions {
  variant?: string;
  title?: string;
  message?: string;
  icon?: string;
  dismissible?: boolean;
  elevated?: boolean;
}

export interface CardoverlayOptions {
  image?: string;
  title?: string;
  subtitle?: string;
  position?: string;
  xalign?: string;
  gradient?: boolean;
  height?: string;
  variant?: string;
}

export interface CardportfolioOptions {
  name?: string;
  title?: string;
  company?: string;
  location?: string;
  cover?: string;
  avatar?: string;
  bio?: string;
  tagline?: string;
  availability?: string;
  email?: string;
  phone?: string;
  website?: string;
  linkedin?: string;
  twitter?: string;
  github?: string;
  dribbble?: string;
  skills?: string;
  skillLevels?: string;
  experience?: string;
  education?: string;
  projects?: string;
  certifications?: string;
  languages?: string;
  stats?: string;
  cta?: string;
  ctaHref?: string;
  variant?: string;
  size?: string;
}

export interface CardpricingOptions {
  plan?: string;
  price?: string;
  period?: string;
  description?: string;
  features?: string;
  cta?: string;
  ctaHref?: string;
  featured?: boolean;
  variant?: string;
}

export interface CardproductOptions {
  image?: string;
  title?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  badge?: string;
  rating?: number;
  reviews?: number;
  cta?: string;
  featured?: boolean;
  variant?: string;
}

export interface CardprofileOptions {
  name?: string;
  role?: string;
  avatar?: string;
  bio?: string;
  cover?: string;
  size?: string;
  align?: string;
  hoverText?: string;
}

export interface CardstatsOptions {
  value?: string;
  label?: string;
  icon?: string;
  trend?: string;
  trendValue?: string;
  variant?: string;
  color?: string;
}

export interface CardtestimonialOptions {
  quote?: string;
  author?: string;
  role?: string;
  avatar?: string;
  rating?: number;
  variant?: string;
  size?: string;
}

export interface CardvideoOptions {
  src?: string;
  poster?: string;
  title?: string;
  description?: string;
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  aspect?: string;
  variant?: string;
}

export interface CheckboxOptions {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  indeterminate?: boolean;
  name?: string;
  value?: string;
  required?: boolean;
  size?: string;
  variant?: string;
}

export interface ChipOptions {
  label?: string;
  icon?: string;
  dismissible?: boolean;
  disabled?: boolean;
  variant?: string;
  size?: string;
  outlined?: boolean;
}

export interface CodecontrolOptions {
}

export interface CollapseOptions {
  expanded?: boolean;
}

export interface ConfettiOptions {
  count?: number;
  label?: string;
  showButton?: boolean;
  repeat?: boolean;
  delay?: string;
  duration?: string;
  colors?: string;
}

export interface ContextmenuOptions {
  items?: any;
  trigger?: string;
  minWidth?: string;
  maxWidth?: string;
  zIndex?: number;
  closeOnSelect?: boolean;
  closeOnOutside?: boolean;
  closeOnEscape?: boolean;
  positioning?: string;
}

export interface CopyOptions {
  text?: string;
  target?: string;
}

export interface DarkmodeOptions {
}

export interface DemoOptions {
  title?: string;
  tag?: string;
  contentClass?: string;
}

export interface DetailsOptions {
  summary?: string;
  open?: boolean;
  name?: string;
  animated?: boolean;
  variant?: string;
}

export interface DialogOptions {
  title?: string;
  content?: string;
  size?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showClose?: boolean;
  variant?: string;
}

export interface DraggableOptions {
  axis?: string;
  handle?: string;
}

export interface DrawerOptions {
  title?: string;
  content?: string;
  position?: string;
  width?: string;
  height?: string;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  showClose?: boolean;
  variant?: string;
}

export interface DrawerLayoutOptions {
  position?: string;
  width?: string;
  minWidth?: string;
  collapsed?: boolean;
}

export interface DropdownOptions {
  position?: string;
  trigger?: string;
  closeOnSelect?: boolean;
  closeOnOutside?: boolean;
  offset?: number;
}

export interface FireworksOptions {
  count?: number;
  label?: string;
  showButton?: boolean;
  repeat?: boolean;
  delay?: string;
  duration?: string;
  colors?: string;
}

export interface Fix_cardOptions {
}

export interface FooterOptions {
  copyright?: string;
  brand?: string;
  links?: string;
  social?: string;
  sticky?: boolean;
}

export interface GlobeOptions {
}

export interface HeaderOptions {
  icon?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  logoHref?: string;
  sticky?: boolean;
}

export interface HeroOptions {
  variant?: string;
}

export interface InputOptions {
  label?: string;
  placeholder?: string;
  value?: string;
  name?: string;
  inputType?: string;
  helper?: string;
  error?: string;
  variant?: string;
  size?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  icon?: string;
  iconPosition?: string;
  clearable?: boolean;
}

export interface MdhtmlOptions {
  src?: string;
  sanitize?: boolean;
  gfm?: boolean;
}

export interface MoveOptions {
}

export interface NavbarOptions {
  brand?: string;
  brandHref?: string;
  logo?: string;
  logoSize?: string;
  tagline?: string;
  items?: string;
  sticky?: boolean;
  variant?: string;
}

export interface NotesOptions {
  position?: string;
  maxWidth?: string;
  minWidth?: string;
  defaultWidth?: string;
  autoSave?: boolean;
  placeholder?: string;
}

export interface Page_builderOptions {
  pages?: any;
  globalSections?: any;
  currentPageId?: string;
  settings?: any;
}

export interface ProgressOptions {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: string;
  size?: string;
  animated?: boolean;
  striped?: boolean;
  indeterminate?: boolean;
}

export interface RatingOptions {
  value?: number;
  max?: number;
  readonly?: boolean;
  disabled?: boolean;
  half?: boolean;
  size?: string;
  icon?: string;
}

export interface ResizableOptions {
  handles?: string;
}

export interface RippleOptions {
  color?: string;
  duration?: number;
  centered?: boolean;
}

export interface ScrollalongOptions {
  offset?: string;
}

export interface Search_indexOptions {
  $generated?: string;
  $version?: string;
  $stats?: any;
  documents?: any;
  index?: any;
}

export interface SelectOptions {
  label?: string;
  placeholder?: string;
  options?: string;
  value?: string;
  name?: string;
  searchable?: boolean;
  clearable?: boolean;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  size?: string;
  variant?: string;
}

export interface SkeletonOptions {
  variant?: string;
  lines?: number;
  width?: string;
  height?: string;
  animated?: boolean;
}

export interface SliderOptions {
}

export interface SnowOptions {
  count?: number;
  label?: string;
  showButton?: boolean;
  repeat?: boolean;
  delay?: string;
  duration?: string;
}

export interface SpanOptions {
  variant?: string;
}

export interface SpinnerOptions {
  size?: string;
  variant?: string;
  speed?: string;
  label?: string;
}

export interface StagelightOptions {
  variant?: string;
  color?: string;
  intensity?: number;
  size?: string;
  speed?: string;
  target?: string;
  label?: string;
}

export interface StickyOptions {
  offset?: string;
  zIndex?: number;
  threshold?: number;
  stuckClass?: string;
  animated?: boolean;
}

export interface SwitchOptions {
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  name?: string;
  value?: string;
  labelPosition?: string;
  size?: string;
  variant?: string;
}

export interface TableOptions {
  data?: string;
  columns?: string;
  sortable?: boolean;
  filterable?: boolean;
  paginated?: boolean;
  pageSize?: number;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  bordered?: boolean;
}

export interface TabsOptions {
  activeTab?: number;
  variant?: string;
  size?: string;
  fullWidth?: boolean;
  vertical?: boolean;
}

export interface TextareaOptions {
  label?: string;
  placeholder?: string;
  value?: string;
  name?: string;
  rows?: number;
  maxLength?: number;
  showCount?: boolean;
  autosize?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  resize?: string;
  variant?: string;
}

export interface ThemecontrolOptions {
}

export interface TimelineOptions {
  $schema?: string;
  items?: string;
}

export interface ToastOptions {
  message?: string;
  title?: string;
  variant?: string;
  icon?: string;
  duration?: number;
  position?: string;
  dismissible?: boolean;
  action?: string;
  actionHref?: string;
}

export interface ToggleOptions {
  target?: string;
}

export interface TooltipOptions {
  content?: string;
  position?: string;
  variant?: string;
  delay?: number;
  hideDelay?: number;
  trigger?: string;
  arrow?: boolean;
  interactive?: boolean;
  maxWidth?: string;
}

export interface ViewsOptions {
  $schema?: string;
  version?: string;
  description?: string;
  views?: any;
}

export interface Wb_controlOptions {
}

export interface Wb_repeaterOptions {
}
