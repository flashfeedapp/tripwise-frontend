import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, RouterLink } from '@angular/router';
import {
  EMPTY,
  Observable,
  Subject,
  catchError,
  forkJoin,
  map,
  merge,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import {
  Destination,
  DestinationContentJson,
  DestinationExperience,
  DestinationFaq,
  DestinationFood,
  ItineraryActivity,
  ItineraryDay,
  TransportMode,
  TripCalculationRequest,
  TripCalculationResponse,
  TripPlanDetails,
  TripPlanOption,
  TripPlanType,
} from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { apiErrorMessage } from '../../shared/api-error-message';
import {
  destinationAttractionImages,
  destinationHeroImages,
  hideBrokenDestinationImage,
  destinationTextItems,
} from '../../shared/destination-image-content';
import { destinationFromRouterState } from '../../shared/destination-state';
import { tripPlanFromRouterState } from '../../shared/trip-plan-state';
import { DestinationBackdropComponent } from '../destination-backdrop/destination-backdrop.component';

@Component({
  selector: 'app-trip-comparison',
  standalone: true,
  imports: [DestinationBackdropComponent, RouterLink],
  templateUrl: './trip-comparison.component.html',
})
export class TripComparisonComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly retryRequest = new Subject<TripCalculationRequest>();
  protected request: TripCalculationRequest | null = null;
  protected result: TripCalculationResponse | null = null;
  protected destination: Destination | null = null;
  protected selectedPlan: TripPlanOption | null = null;
  protected activeTab: 'overview' | 'itinerary' | 'transport' | 'budget' | 'guide' = 'overview';
  protected loading = true;
  protected errorMessage = '';
  protected guideErrorMessage = '';
  protected planDetailsErrorMessage = '';
  protected readonly tabs = [
    { id: 'overview', label: 'Overview', icon: '⌂' },
    { id: 'itinerary', label: 'Itinerary', icon: '▤' },
    { id: 'transport', label: 'Transport', icon: '⇄' },
    { id: 'budget', label: 'Budget', icon: '₹' },
    { id: 'guide', label: 'Travel Guide', icon: '✦' },
  ] as const;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: TripWiseApiService,
    private readonly location: Location,
  ) {}

  ngOnInit(): void {
    merge(
      this.route.queryParamMap.pipe(map((params) => this.parseRequest(params))),
      this.retryRequest,
    )
      .pipe(
        switchMap((request) => {
          if (!request) {
            this.loading = false;
            this.errorMessage = 'The trip comparison link is missing valid trip details.';
            this.request = null;
            return EMPTY;
          }

          this.request = request;
          this.destination = destinationFromRouterState(
            this.location.getState(),
            request.destinationId,
          );
          this.loading = true;
          this.errorMessage = '';
          this.guideErrorMessage = '';
          this.planDetailsErrorMessage = '';
          this.result = null;
          this.selectedPlan = tripPlanFromRouterState(
            this.location.getState(),
            request.destinationId,
            request.planType,
          );
          const destination$ = this.loadDestination(request.destinationId).pipe(
            tap((destination) => {
              if (this.request?.destinationId === request.destinationId) {
                this.destination = destination;
              }
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
          );
          const selectedPlan$ = this.loadSelectedPlan(
            request.destinationId,
            request.planType,
          ).pipe(
            tap((plan) => {
              if (
                this.request?.destinationId === request.destinationId &&
                this.request.planType === request.planType
              ) {
                this.selectedPlan = plan;
              }
            }),
            shareReplay({ bufferSize: 1, refCount: true }),
          );
          destination$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
          selectedPlan$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
          return this.api.calculateTrip(request.destinationId, request).pipe(
            switchMap((result) =>
              forkJoin({ destination: destination$, selectedPlan: selectedPlan$ }).pipe(
                map(({ destination, selectedPlan }) => ({
                  result,
                  destination,
                  selectedPlan,
                })),
              ),
            ),
            catchError((error: HttpErrorResponse) => {
              this.loading = false;
              this.errorMessage = apiErrorMessage(error, 'Trip comparison');
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ result, destination, selectedPlan }) => {
        this.result = result;
        this.destination = destination;
        this.selectedPlan = selectedPlan;
        this.loading = false;
      });
  }

  protected selectTab(tab: (typeof this.tabs)[number]['id']): void {
    this.activeTab = tab;
  }

  protected formatPlanType(planType: TripPlanType): string {
    return planType
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  protected retry(): void {
    if (this.request) {
      this.retryRequest.next(this.request);
    }
  }

  protected retryGuide(): void {
    if (!this.request) {
      return;
    }

    this.guideErrorMessage = '';
    this.api
      .getDestination(this.request.destinationId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (destination) => {
          this.destination = destination;
          this.guideErrorMessage = '';
        },
        error: (error: HttpErrorResponse) => {
          this.guideErrorMessage = apiErrorMessage(error, 'Destination guide');
        },
      });
  }

  protected formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  protected perPersonTravelCost(
    option: TripCalculationResponse['travelOptions'][number],
  ): string {
    return this.hasPerPersonTravelEstimate(option)
      ? this.formatCurrency(option.estimatedCostPerPerson)
      : 'Estimate unavailable';
  }

  protected totalTravelCost(
    option: TripCalculationResponse['travelOptions'][number],
  ): string {
    return this.hasTotalTravelEstimate(option)
      ? this.formatCurrency(option.totalTravelCost)
      : 'Estimate unavailable';
  }

  protected get returnedTravelOptions(): TripCalculationResponse['travelOptions'] {
    return this.result?.travelOptions ?? [];
  }

  protected get planDetails(): TripPlanDetails | null {
    return this.selectedPlan?.detailsJson ?? null;
  }

  protected get itinerary(): ItineraryDay[] {
    return this.planDetails?.itinerary ?? [];
  }

  protected get destinationContent(): DestinationContentJson | null {
    return this.destination?.contentJson ?? null;
  }

  protected get highlights(): string[] {
    return destinationTextItems(this.destination?.highlights);
  }

  protected get experiences(): DestinationExperience[] {
    return this.destinationContent?.experiences ?? [];
  }

  protected get localFood(): DestinationFood[] {
    const food = this.destinationContent?.localFood;
    if (!food) {
      return [];
    }

    return (Array.isArray(food) ? food : [food])
      .map((item) => (typeof item === 'string' ? { name: item } : item))
      .filter((item) => item.name.trim().length > 0);
  }

  protected get faqs(): DestinationFaq[] {
    return this.destinationContent?.faqs ?? [];
  }

  protected get bestTimeMonths(): string | null {
    const bestTime = this.destinationContent?.bestTimeToVisit;
    if (typeof bestTime === 'string') {
      return bestTime.trim() || null;
    }

    return bestTime?.months?.trim() || this.destination?.bestSeason?.trim() || null;
  }

  protected get bestTimeWeather(): string | null {
    const bestTime = this.destinationContent?.bestTimeToVisit;
    return typeof bestTime === 'object' && bestTime
      ? bestTime.weather?.trim() || null
      : null;
  }

  protected get contentTravelTips(): string[] {
    return this.contentItems(this.destinationContent?.travelTips);
  }

  protected get thingsToCarry(): string[] {
    return this.contentItems(this.destinationContent?.whatToCarry);
  }

  protected get contentDos(): string[] {
    return this.contentItems(this.destinationContent?.dos ?? this.destination?.dos);
  }

  protected get contentDonts(): string[] {
    return this.contentItems(this.destinationContent?.donts ?? this.destination?.donts);
  }

  protected get inclusions(): string[] {
    return this.planDetails?.inclusions ?? [];
  }

  protected get exclusions(): string[] {
    return this.planDetails?.exclusions ?? [];
  }

  protected get planNotes(): string[] {
    return this.planDetails?.notes ?? [];
  }

  protected get summaryImageUrl(): string | null {
    if (!this.destination) {
      return null;
    }

    return destinationHeroImages(this.destination)[0]?.imageUrl ?? null;
  }

  protected onSummaryImageError(event: Event): void {
    hideBrokenDestinationImage(event);
  }

  protected hasPerPersonTravelEstimate(
    option: TripCalculationResponse['travelOptions'][number],
  ): boolean {
    return Number.isFinite(option.estimatedCostPerPerson) && option.estimatedCostPerPerson > 0;
  }

  protected hasTotalTravelEstimate(
    option: TripCalculationResponse['travelOptions'][number],
  ): boolean {
    return Number.isFinite(option.totalTravelCost) && option.totalTravelCost > 0;
  }

  protected hasTransportEstimate(option: TripCalculationResponse['travelOptions'][number]): boolean {
    return this.hasPerPersonTravelEstimate(option) || this.hasTotalTravelEstimate(option);
  }

  protected hasCompleteTripEstimate(option: TripCalculationResponse['travelOptions'][number]): boolean {
    const planTotal = this.result?.totalTripCost;
    return (
      this.hasPerPersonTravelEstimate(option) &&
      this.hasTotalTravelEstimate(option) &&
      Number.isFinite(option.totalEstimatedCost) &&
      option.totalEstimatedCost > 0 &&
      planTotal !== undefined &&
      option.totalEstimatedCost > planTotal
    );
  }

  protected get hasAnyTransportEstimate(): boolean {
    return this.returnedTravelOptions.some((option) => this.hasTransportEstimate(option));
  }

  protected perPersonGroupCost(groupCost: number): number {
    const travellers = this.result?.travellers ?? 0;
    return travellers > 0 ? groupCost / travellers : 0;
  }

  protected journeyDuration(option: TripCalculationResponse['travelOptions'][number]): string {
    return option.estimatedDuration?.trim() || 'Estimate unavailable';
  }

  protected transportLabel(mode: TransportMode): string {
    const labels: Record<TransportMode, string> = {
      BUS: 'Bus',
      TRAIN: 'Train',
      CAR: 'Car',
      FLIGHT: 'Flight',
    };
    return labels[mode];
  }

  protected contentItems(value: string[] | string | null | undefined): string[] {
    return Array.isArray(value)
      ? value.map((item) => item.trim()).filter(Boolean)
      : destinationTextItems(value);
  }

  protected experienceImage(title: string, imageUrl?: string | null): string | null {
    const providedUrl = imageUrl?.trim();
    if (providedUrl) {
      return providedUrl;
    }

    if (!this.destination) {
      return null;
    }

    const ignoredWords = new Set(['and', 'experience', 'exploration', 'explore', 'visit']);
    const terms = (value: string): Set<string> =>
      new Set(
        value
          .toLocaleLowerCase()
          .split(/[^a-z0-9]+/)
          .filter((term) => term.length > 3 && !ignoredWords.has(term))
          .map((term) => (term.endsWith('s') ? term.slice(0, -1) : term)),
      );
    const experienceTerms = terms(title);
    if (experienceTerms.size === 0) {
      return null;
    }

    return (
      destinationAttractionImages(this.destination)
        .map((image) => ({
          image,
          matchCount: [...terms(image.title)].filter((term) => experienceTerms.has(term)).length,
        }))
        .sort((left, right) => right.matchCount - left.matchCount)
        .find((match) => match.matchCount > 0)?.image.imageUrl ?? null
    );
  }

  protected itineraryImage(activity: ItineraryActivity): string | null {
    return this.experienceImage(
      activity.attraction?.trim() || activity.title?.trim() || '',
      activity.imageUrl,
    );
  }

  protected onContentImageError(event: Event): void {
    hideBrokenDestinationImage(event);
  }

  private loadDestination(destinationId: number): Observable<Destination | null> {
    if (this.destination?.id === destinationId) {
      return of(this.destination);
    }

    const navigationDestination = destinationFromRouterState(
      this.location.getState(),
      destinationId,
    );
    if (navigationDestination) {
      return of(navigationDestination);
    }

    return this.api.getDestination(destinationId).pipe(
      catchError((error: HttpErrorResponse) => {
        this.guideErrorMessage = apiErrorMessage(error, 'Destination guide');
        return of(null);
      }),
    );
  }

  private loadSelectedPlan(
    destinationId: number,
    planType: TripPlanType,
  ): Observable<TripPlanOption | null> {
    const navigationPlan = tripPlanFromRouterState(
      this.location.getState(),
      destinationId,
      planType,
    );
    if (navigationPlan) {
      return of(navigationPlan);
    }

    return this.api.getPlans(destinationId).pipe(
      map((plans) => {
        const selectedPlan = plans.find((plan) => plan.planType === planType) ?? null;
        if (!selectedPlan) {
          this.planDetailsErrorMessage = 'Selected plan details were not returned by the service.';
        }
        return selectedPlan;
      }),
      catchError((error: HttpErrorResponse) => {
        this.planDetailsErrorMessage = apiErrorMessage(error, 'Selected plan details');
        return of(null);
      }),
    );
  }

  private parseRequest(params: ParamMap): TripCalculationRequest | null {
    const startingCity = params.get('startingCity')?.trim() ?? '';
    const destinationId = Number(params.get('destinationId'));
    const planType = params.get('planType');
    const travellers = Number(params.get('travellers'));
    const validPlanTypes: TripPlanType[] = [
      'QUICK_ESCAPE',
      'BEST_OF_DESTINATION',
      'RELAXED_EXPLORER',
    ];

    if (
      startingCity.length < 2 ||
      startingCity.length > 80 ||
      !Number.isSafeInteger(destinationId) ||
      destinationId < 1 ||
      !planType ||
      !validPlanTypes.includes(planType as TripPlanType) ||
      !Number.isInteger(travellers) ||
      travellers < 1 ||
      travellers > 20
    ) {
      return null;
    }

    return {
      startingCity,
      destinationId,
      planType: planType as TripPlanType,
      travellers,
    };
  }
}
