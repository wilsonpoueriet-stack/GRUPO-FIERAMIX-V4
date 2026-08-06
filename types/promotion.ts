export type PromotionCategory =
  | "station"
  | "program"
  | "podcast"
  | "event"
  | "news"
  | "advertising";

export type Promotion = {
  id: string;
  title: string;
  description?: string;
  category: PromotionCategory;
  image: string;
  href: string;
  buttonText?: string;
  active: boolean;
  startDate?: string;
  endDate?: string;
  priority?: number;
};