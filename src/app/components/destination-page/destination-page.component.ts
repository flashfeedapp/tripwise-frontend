import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EMPTY, catchError, map, switchMap } from 'rxjs';
import { Destination } from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { apiErrorMessage } from '../../shared/api-error-message';
import { DestinationGuideComponent } from '../destination-guide/destination-guide.component';

@Component({
  selector: 'app-destination-page',
  standalone: true,
  imports: [DestinationGuideComponent, RouterLink],
  templateUrl: './destination-page.component.html',
})
export class DestinationPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  protected destination: Destination | null = null;
  protected loading = true;
  protected errorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: TripWiseApiService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          const id = Number(params.get('id'));
          if (!Number.isSafeInteger(id) || id < 1) {
            this.destination = null;
            this.loading = false;
            this.errorMessage = 'This destination link is not valid.';
            return EMPTY;
          }

          this.destination = null;
          this.loading = true;
          this.errorMessage = '';
          return this.api.getDestination(id).pipe(
            map((destination) => (destination?.id === id ? destination : null)),
            catchError((error: HttpErrorResponse) => {
              this.loading = false;
              this.errorMessage = apiErrorMessage(error, 'Destination details');
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((destination) => {
        if (!destination) {
          this.errorMessage = 'The requested destination could not be found.';
        } else {
          this.destination = destination;
        }
        this.loading = false;
      });
  }

  protected retry(): void {
    this.loading = true;
    this.errorMessage = '';
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id < 1) {
      this.destination = null;
      this.loading = false;
      this.errorMessage = 'This destination link is not valid.';
      return;
    }

    this.destination = null;
    this.api
      .getDestination(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (destination) => {
          if (!destination || destination.id !== id) {
            this.errorMessage = 'The requested destination could not be found.';
          } else {
            this.destination = destination;
          }
          this.loading = false;
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = apiErrorMessage(error, 'Destination details');
          this.loading = false;
        },
      });
  }
}
