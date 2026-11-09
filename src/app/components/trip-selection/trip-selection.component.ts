import { Location } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, forkJoin, of, switchMap } from 'rxjs';
import { Destination, TripPlanOption, TripPlanType } from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { apiErrorMessage } from '../../shared/api-error-message';
import { destinationFromRouterState } from '../../shared/destination-state';
import { DestinationBackdropComponent } from '../destination-backdrop/destination-backdrop.component';

@Component({
  selector: 'app-trip-selection',
  standalone: true,
  imports: [DestinationBackdropComponent, FormsModule, RouterLink],
  templateUrl: './trip-selection.component.html',
})
export class TripSelectionComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  protected destination: Destination | null = null;
  protected plans: TripPlanOption[] = [];
  protected selectedPlanType: TripPlanType | null = null;
  protected startingCity = '';
  protected travellers: number | null = 2;
  protected loading = true;
  protected submitting = false;
  protected errorMessage = '';
  protected formError = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: TripWiseApiService,
    private readonly location: Location,
  ) {}

  ngOnInit(): void {
    const startingCity = this.route.snapshot.queryParamMap.get('startingCity')?.trim() ?? '';
    const travellers = Number(this.route.snapshot.queryParamMap.get('travellers'));
    if (startingCity.length >= 2 && startingCity.length <= 80) {
      this.startingCity = startingCity;
    }
    if (Number.isInteger(travellers) && travellers >= 1 && travellers <= 20) {
      this.travellers = travellers;
    }

    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const destinationId = Number(params.get('id'));
          if (!Number.isSafeInteger(destinationId) || destinationId < 1) {
            this.destination = null;
            this.loading = false;
            this.errorMessage = 'This destination link is not valid.';
            return EMPTY;
          }

          this.destination = destinationFromRouterState(
            this.location.getState(),
            destinationId,
          );
          this.loading = true;
          this.errorMessage = '';
          return forkJoin({
            destination: this.loadDestination(destinationId),
            plans: this.api.getPlans(destinationId),
          }).pipe(
            catchError((error: HttpErrorResponse) => {
              this.loading = false;
              this.errorMessage = apiErrorMessage(error, 'Trip plans');
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ destination, plans }) => {
        this.destination = destination;
        this.plans = plans.filter((plan) => plan.active);
        this.selectedPlanType = null;
        this.loading = false;
      });
  }

  protected selectPlan(planType: TripPlanType): void {
    this.selectedPlanType = planType;
    this.formError = '';
  }

  protected continueToCompare(): void {
    const destination = this.destination;
    const travellers = this.travellers;
    const city = this.startingCity.trim();
    const planType = this.selectedPlanType;

    if (!destination || !planType) {
      this.formError = 'Select one of the available trip plans to continue.';
      return;
    }
    if (city.length < 2 || city.length > 80) {
      this.formError = 'Enter a starting city with between 2 and 80 characters.';
      return;
    }
    if (!Number.isInteger(travellers) || travellers === null || travellers < 1 || travellers > 20) {
      this.formError = 'Choose a whole number of travellers from 1 to 20.';
      return;
    }

    this.submitting = true;
    const plan = this.plans.find((option) => option.planType === planType);
    void this.router
      .navigate(['/trips/compare'], {
        queryParams: {
          startingCity: city,
          destinationId: destination.id,
          planType,
          travellers,
        },
        state: { destination, plan },
      })
      .finally(() => (this.submitting = false));
  }

  protected formatCurrency(amount: number): string {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  }

  protected planCostPerPerson(plan: TripPlanOption): number {
    return plan.estimatedStayCost + plan.estimatedFoodCost + plan.estimatedActivityCost;
  }

  protected planCostForTravellers(plan: TripPlanOption): number | null {
    return Number.isInteger(this.travellers) && this.travellers !== null && this.travellers >= 1 && this.travellers <= 20
      ? this.planCostPerPerson(plan) * this.travellers
      : null;
  }

  protected formatPlanType(planType: TripPlanType): string {
    return planType
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  protected retry(): void {
    this.loading = true;
    this.errorMessage = '';
    const destinationId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(destinationId) || destinationId < 1) {
      this.loading = false;
      this.errorMessage = 'This destination link is not valid.';
      return;
    }

    forkJoin({
      destination: this.loadDestination(destinationId),
      plans: this.api.getPlans(destinationId),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ destination, plans }) => {
          this.destination = destination;
          this.plans = plans.filter((plan) => plan.active);
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = apiErrorMessage(error, 'Trip plans');
          this.loading = false;
        },
      });
  }

  private loadDestination(destinationId: number) {
    if (this.destination?.id === destinationId) {
      return of(this.destination);
    }

    const navigationDestination = destinationFromRouterState(
      this.location.getState(),
      destinationId,
    );
    return navigationDestination
      ? of(navigationDestination)
      : this.api.getDestination(destinationId);
  }
}
