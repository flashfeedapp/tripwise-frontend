import { HttpErrorResponse } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  OnDestroy,
  PLATFORM_ID,
  SimpleChanges,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  Destination,
  DestinationAttraction,
  DestinationCategory,
  DestinationContentJson,
  DestinationExperience,
  DestinationFaq,
  DestinationFood,
  DestinationImage,
  ItineraryActivity,
  ItineraryDay,
  TripPlanOption,
} from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { apiErrorMessage } from '../../shared/api-error-message';
import {
  destinationAttractionImages,
  destinationHeroImages,
  destinationTextItems,
  hideBrokenDestinationImage,
} from '../../shared/destination-image-content';
import { DestinationBackdropComponent } from '../destination-backdrop/destination-backdrop.component';

@Component({
  selector: 'app-destination-guide',
  standalone: true,
  imports: [DestinationBackdropComponent, FormsModule, RouterLink],
  templateUrl: './destination-guide.component.html',
})
export class DestinationGuideComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) destination!: Destination;
  @Input() showPlanCta = false;
  @Input() immersive = false;

  protected activeTab:
    | 'overview'
    | 'attractions'
    | 'food-stays'
    | 'local-travel'
    | 'itinerary'
    | 'packages'
    | 'calculator' = 'overview';
  protected readonly tabs = [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'attractions', label: 'Attractions', icon: '✧' },
    { id: 'food-stays', label: 'Food & Stays', icon: '◈' },
    { id: 'local-travel', label: 'Local Travel', icon: '⇄' },
    { id: 'itinerary', label: 'Itinerary', icon: '▤' },
    { id: 'packages', label: 'Packages', icon: '◇' },
    { id: 'calculator', label: 'Calculate My Trip', icon: '₹' },
  ] as const;
  protected slideIndex = 0;
  protected tripPlans: TripPlanOption[] = [];
  protected selectedItineraryPlanId: number | null = null;
  protected selectedItineraryDays = 1;
  protected plansLoading = false;
  protected plansErrorMessage = '';
  protected startingCity = '';
  protected travellers: number | null = 2;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private slideTimer: ReturnType<typeof setInterval> | null = null;
  private plansRequestId = 0;

  constructor(
    private readonly api: TripWiseApiService,
    private readonly router: Router,
  ) {}

  protected get heroPhotos(): DestinationImage[] {
    return this.destination ? destinationHeroImages(this.destination) : [];
  }

  protected get attractionPhotos(): DestinationImage[] {
    return this.destination ? destinationAttractionImages(this.destination) : [];
  }

  protected get highlights(): string[] {
    return this.destination ? destinationTextItems(this.destination.highlights) : [];
  }

  protected get historyText(): string | null {
    return (
      this.content?.historyAndCulture?.history?.trim() ||
      this.destination?.history?.trim() ||
      null
    );
  }

  protected get cultureText(): string | null {
    return this.content?.historyAndCulture?.culture?.trim() || null;
  }

  protected get whyVisit(): string[] {
    return this.contentItems(this.destination?.contentJson?.whyVisit ?? this.highlights);
  }

  protected get content(): DestinationContentJson | null {
    return this.destination?.contentJson ?? null;
  }

  protected get experiences(): DestinationExperience[] {
    return this.content?.experiences ?? [];
  }

  protected get localFood(): DestinationFood[] {
    const food = this.content?.localFood;
    if (!food) {
      return [];
    }

    return (Array.isArray(food) ? food : [food])
      .map((item) => (typeof item === 'string' ? { name: item } : item))
      .filter((item) => item.name.trim().length > 0);
  }

  protected get faqs(): DestinationFaq[] {
    return this.content?.faqs ?? [];
  }

  protected get itineraryPlan(): TripPlanOption | null {
    return this.tripPlans.find((plan) => plan.id === this.selectedItineraryPlanId) ?? null;
  }

  protected get itinerary(): ItineraryDay[] {
    return this.itineraryPlan?.detailsJson?.itinerary?.slice(0, this.selectedItineraryDays) ?? [];
  }

  protected get itineraryDataDays(): number {
    return this.itineraryPlan?.detailsJson?.itinerary?.length ?? 0;
  }

  protected get bestTimeMonths(): string | null {
    const bestTime = this.content?.bestTimeToVisit;
    if (typeof bestTime === 'string') {
      return bestTime.trim() || null;
    }
    return bestTime?.months?.trim() || this.destination?.bestSeason?.trim() || null;
  }

  protected get bestTimeWeather(): string | null {
    const bestTime = this.content?.bestTimeToVisit;
    return typeof bestTime === 'object' && bestTime
      ? bestTime.weather?.trim() || null
      : null;
  }

  protected get howToReach(): string[] {
    const reach = this.content?.howToReach ?? this.destination?.howToReach;
    if (typeof reach === 'string') {
      return this.contentItems(reach);
    }
    if (Array.isArray(reach)) {
      return this.contentItems(reach);
    }
    return reach && typeof reach === 'object'
      ? Object.entries(reach)
          .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
          .map(([mode, details]) => `${this.formatLabel(mode)}: ${details}`)
      : [];
  }

  protected get localTransport(): string[] {
    return this.contentItems(
      this.content?.localTransport ?? this.destination?.localTransport,
    );
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['destination']) {
      this.slideIndex = 0;
      this.stopSlideshow();
      if (this.isBrowser && this.heroPhotos.length > 1) {
        this.slideTimer = setInterval(() => this.nextSlide(), 5000);
      }
      this.loadTripPlans();
    }
  }

  ngOnDestroy(): void {
    this.stopSlideshow();
  }

  protected nextSlide(): void {
    if (this.heroPhotos.length > 1) {
      this.slideIndex = (this.slideIndex + 1) % this.heroPhotos.length;
    }
  }

  protected previousSlide(): void {
    if (this.heroPhotos.length > 1) {
      this.slideIndex = (this.slideIndex - 1 + this.heroPhotos.length) % this.heroPhotos.length;
    }
  }

  protected selectSlide(index: number): void {
    if (index >= 0 && index < this.heroPhotos.length) {
      this.slideIndex = index;
    }
  }

  protected selectTab(tab: (typeof this.tabs)[number]['id']): void {
    this.activeTab = tab;
  }

  protected setItineraryPlan(event: Event): void {
    const select = event.currentTarget;
    const planId = select instanceof HTMLSelectElement ? Number(select.value) : Number.NaN;
    if (Number.isSafeInteger(planId) && this.tripPlans.some((plan) => plan.id === planId)) {
      this.selectedItineraryPlanId = planId;
      this.selectedItineraryDays = 1;
    }
  }

  protected setItineraryDays(event: Event): void {
    const select = event.currentTarget;
    const days = select instanceof HTMLSelectElement ? Number(select.value) : Number.NaN;
    if (Number.isInteger(days) && days >= 1 && days <= 5) {
      this.selectedItineraryDays = days;
    }
  }

  protected calculateTrip(): void {
    const city = this.startingCity.trim();
    if (!this.destination || city.length < 2 || city.length > 80) {
      return;
    }
    if (!Number.isInteger(this.travellers) || this.travellers === null || this.travellers < 1 || this.travellers > 20) {
      return;
    }

    void this.router.navigate(['/destinations', this.destination.id, 'plans'], {
      queryParams: { startingCity: city, travellers: this.travellers },
      state: { destination: this.destination },
    });
  }

  protected displayEstimate(value: string | number | null | undefined): string | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) && value > 0
        ? `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
        : null;
    }
    return value?.trim() || null;
  }

  protected itineraryImage(activity: ItineraryActivity): string | null {
    const imageUrl = activity.imageUrl?.trim();
    if (imageUrl) {
      return imageUrl;
    }
    const title = activity.attraction?.trim() || activity.title?.trim() || '';
    const details = this.attractionDetails(title);
    const matchingImage = this.attractionPhotos.find(
      (photo) => photo.title.toLocaleLowerCase() === details?.name.toLocaleLowerCase(),
    );
    return matchingImage?.imageUrl ?? null;
  }

  protected onImageError(event: Event): void {
    hideBrokenDestinationImage(event);
  }

  protected formatCategory(category: DestinationCategory): string {
    return category
      .replaceAll('_AND_', ' & ')
      .replaceAll('_', ' ')
      .split(' ')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  protected textList(value: unknown): string[] {
    return this.contentItems(value);
  }

  protected contentItems(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .flatMap((item) => this.contentItems(item))
        .filter(Boolean);
    }

    if (typeof value === 'string') {
      return destinationTextItems(value);
    }

    return value !== null && typeof value === 'object'
      ? Object.values(value).flatMap((item) => this.contentItems(item))
      : [];
  }

  protected attractionDescription(attractionTitle: string): string | null {
    return this.attractionDetails(attractionTitle)?.description?.trim() || null;
  }

  protected attractionWhyVisit(attractionTitle: string): string | null {
    return this.attractionDetails(attractionTitle)?.whyVisit?.trim() || null;
  }

  protected experienceImageUrl(experience: DestinationExperience): string | null {
    const providedUrl = experience.imageUrl?.trim();
    if (providedUrl) {
      return providedUrl;
    }

    const experienceTerms = new Set(
      experience.title
        .toLocaleLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length > 3),
    );
    if (experienceTerms.size === 0) {
      return null;
    }

    return (
      this.attractionPhotos.find((image) =>
        image.title
          .toLocaleLowerCase()
          .split(/[^a-z0-9]+/)
          .some((term) => term.length > 3 && experienceTerms.has(term)),
      )?.imageUrl ?? null
    );
  }

  protected onHeroImageError(event: Event): void {
    const image = event.currentTarget;
    if (!(image instanceof HTMLImageElement)) {
      return;
    }

    const wasActive = image.classList.contains('active');
    image.hidden = true;
    if (wasActive && this.heroPhotos.length > 1) {
      this.nextSlide();
    }
    if ([...image.parentElement?.querySelectorAll('img') ?? []].every((photo) => photo.hidden)) {
      image.parentElement?.classList.add('image-unavailable');
    }
  }

  protected onAttractionImageError(event: Event): void {
    hideBrokenDestinationImage(event);
  }

  protected onExperienceImageError(event: Event): void {
    hideBrokenDestinationImage(event);
  }

  protected attractionDetails(title: string): DestinationAttraction | undefined {
    const normalize = (value: string): string => value.trim().toLocaleLowerCase();
    const normalizedTitle = normalize(title);
    return this.content?.attractions?.find(
      (attraction) => {
        const normalizedName = normalize(attraction.name);
        return (
          normalizedName === normalizedTitle ||
          normalizedName.includes(normalizedTitle) ||
          normalizedTitle.includes(normalizedName)
        );
      },
    );
  }

  private formatLabel(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }

  private stopSlideshow(): void {
    if (this.slideTimer !== null) {
      clearInterval(this.slideTimer);
      this.slideTimer = null;
    }
  }

  protected loadTripPlans(): void {
    const destinationId = this.destination?.id;
    const requestId = ++this.plansRequestId;
    if (!destinationId) {
      this.tripPlans = [];
      this.selectedItineraryPlanId = null;
      return;
    }

    this.tripPlans = [];
    this.selectedItineraryPlanId = null;
    this.plansLoading = true;
    this.plansErrorMessage = '';
    this.api
      .getPlans(destinationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (plans) => {
          if (requestId !== this.plansRequestId) {
            return;
          }
          this.tripPlans = plans.filter((plan) => plan.active);
          const itineraryPlan =
            this.tripPlans.find((plan) => (plan.detailsJson?.itinerary?.length ?? 0) > 0) ??
            this.tripPlans[0];
          this.selectedItineraryPlanId = itineraryPlan?.id ?? null;
          this.selectedItineraryDays = 1;
          this.plansLoading = false;
        },
        error: (error: HttpErrorResponse) => {
          if (requestId !== this.plansRequestId) {
            return;
          }
          this.plansErrorMessage = apiErrorMessage(error, 'Trip plans');
          this.plansLoading = false;
        },
      });
  }
}
