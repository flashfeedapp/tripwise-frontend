export type DestinationCategory =
  | 'NATURE_AND_HILLS'
  | 'BEACHES'
  | 'FOREST_AND_WILDLIFE'
  | 'HISTORY_AND_CULTURE'
  | 'SPIRITUAL_PLACES';

export type TripPlanType = 'QUICK_ESCAPE' | 'BEST_OF_DESTINATION' | 'RELAXED_EXPLORER';

export type TransportMode = 'BUS' | 'TRAIN' | 'CAR' | 'FLIGHT';

export interface DestinationImage {
  id: number;
  title: string;
  imageUrl: string;
  displayOrder: number;
}

export interface DestinationImages {
  hero: DestinationImage[];
  attractions: DestinationImage[];
}

export interface DestinationExperience {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
}

export interface DestinationFood {
  name: string;
  description?: string | null;
  approximateCost?: string | number | null;
  regionalSpeciality?: string | null;
}

export interface DestinationFaq {
  question: string;
  answer: string;
}

export interface DestinationHistoryAndCulture {
  history?: string | null;
  culture?: string | null;
}

export interface DestinationHowToReach {
  air?: string | null;
  rail?: string | null;
  road?: string | null;
}

export interface DestinationAttraction {
  name: string;
  description?: string | null;
  whyVisit?: string | null;
  location?: string | null;
  distance?: string | number | null;
  openingHours?: string | null;
  entryFee?: string | number | null;
  suggestedVisitDuration?: string | null;
}

export interface DestinationContentJson {
  introduction?: string | null;
  whyVisit?: string[] | string | null;
  historyAndCulture?: DestinationHistoryAndCulture | null;
  attractions?: DestinationAttraction[] | null;
  experiences?: DestinationExperience[] | null;
  localFood?: DestinationFood | DestinationFood[] | string[] | null;
  bestTimeToVisit?: {
    months?: string | null;
    weather?: string | null;
  } | string | null;
  whatToCarry?: string[] | string | null;
  travelTips?: string[] | string | null;
  howToReach?: DestinationHowToReach | string[] | string | null;
  localTransport?: string[] | string | null;
  dos?: string[] | string | null;
  donts?: string[] | string | null;
  faqs?: DestinationFaq[] | null;
}

export interface Destination {
  id: number;
  name: string;
  state: string;
  category: DestinationCategory;
  shortDescription: string | null;
  overview: string | null;
  history: string | null;
  highlights: string;
  howToReach?: DestinationHowToReach | string[] | string | null;
  localTransport?: string[] | string | null;
  bestSeason: string | null;
  travelTips: string | null;
  dos?: string | null;
  donts?: string | null;
  helplineNumbers?: string | null;
  images: DestinationImages;
  contentJson?: DestinationContentJson | null;
}

export interface ItineraryActivity {
  time?: string | null;
  title?: string | null;
  description?: string | null;
  duration?: string | null;
  attraction?: string | null;
  imageUrl?: string | null;
}

export interface ItineraryDay {
  day?: number | string | null;
  title?: string | null;
  activities?: ItineraryActivity[] | null;
}

export interface TripPlanDetails {
  overview?: string | null;
  itinerary?: ItineraryDay[] | null;
  inclusions?: string[] | null;
  exclusions?: string[] | null;
  notes?: string[] | null;
}

export interface TripPlanOption {
  id: number;
  destinationId: number;
  planType: TripPlanType;
  title: string;
  description: string;
  durationDays: number;
  estimatedStayCost: number;
  estimatedFoodCost: number;
  estimatedActivityCost: number;
  active: boolean;
  detailsJson?: TripPlanDetails | null;
}

export interface TripCalculationRequest {
  startingCity: string;
  destinationId: number;
  planType: TripPlanType;
  travellers: number;
}

export interface TravelOption {
  transportMode: TransportMode;
  estimatedCostPerPerson: number;
  totalTravelCost: number;
  estimatedDuration: string;
  totalEstimatedCost: number;
}

export interface TripCalculationResponse {
  startingCity: string;
  destinationName: string;
  planType: TripPlanType;
  planTitle: string;
  planDescription: string;
  durationDays: number;
  travellers: number;
  stayCost: number;
  foodCost: number;
  activityCost: number;
  tripCostPerPerson: number;
  totalTripCost: number;
  travelOptions: TravelOption[];
}

export interface DestinationCategoryOption {
  id: DestinationCategory | 'ALL';
  name: string;
  emoji: string;
  heading: string;
}
