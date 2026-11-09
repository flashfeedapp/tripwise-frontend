import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Destination,
  TripCalculationRequest,
  TripCalculationResponse,
  TripPlanOption,
} from '../models/trip.models';

@Injectable({ providedIn: 'root' })
export class TripWiseApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  getDestinations(): Observable<Destination[]> {
    return this.http.get<Destination[]>(`${this.baseUrl}/destinations`);
  }

  getDestination(destinationId: number): Observable<Destination> {
    return this.http.get<Destination>(`${this.baseUrl}/destinations/${destinationId}`);
  }

  getPlans(destinationId: number): Observable<TripPlanOption[]> {
    return this.http.get<TripPlanOption[]>(`${this.baseUrl}/destinations/${destinationId}/plans`);
  }

  calculateTrip(
    destinationId: number,
    request: TripCalculationRequest,
  ): Observable<TripCalculationResponse> {
    return this.http.post<TripCalculationResponse>(
      `${this.baseUrl}/destinations/${destinationId}/plans/calculate`,
      request,
    );
  }
}
