import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import {
  Destination,
  TripCalculationRequest,
  TripCalculationResponse,
} from '../models/trip.models';
import { TripWiseApiService } from './trip-wise-api.service';

describe('TripWiseApiService', () => {
  let service: TripWiseApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(TripWiseApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads all destinations from the REST API', () => {
    const response: Destination[] = [
      {
        id: 2,
        name: 'Araku Valley',
        state: 'Andhra Pradesh',
        category: 'NATURE_AND_HILLS',
        shortDescription: null,
        overview: null,
        history: null,
        highlights: 'Coffee Plantations, Borra Caves',
        bestSeason: null,
        travelTips: null,
        images: {
          hero: [{ id: 1, title: 'Araku', imageUrl: '/araku.jpg', displayOrder: 1 }],
          attractions: [],
        },
      },
    ];
    service
      .getDestinations()
      .subscribe((destinations) => expect(destinations).toEqual(response));
    const request = http.expectOne('/api/destinations');
    expect(request.request.method).toBe('GET');
    request.flush(response);
  });

  it('loads destination details by ID', () => {
    service.getDestination(2).subscribe();
    const request = http.expectOne('/api/destinations/2');
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('loads available destination plans', () => {
    service.getPlans(2).subscribe((plans) => expect(plans).toEqual([]));
    const request = http.expectOne('/api/destinations/2/plans');
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('posts the selected trip request to the documented calculation endpoint', () => {
    const body: TripCalculationRequest = {
      startingCity: 'Hyderabad',
      destinationId: 2,
      planType: 'BEST_OF_DESTINATION',
      travellers: 2,
    };
    service.calculateTrip(2, body).subscribe();
    const request = http.expectOne('/api/destinations/2/plans/calculate');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(body);
    request.flush({
      startingCity: 'Hyderabad',
      destinationName: 'Araku Valley',
      planType: 'BEST_OF_DESTINATION',
      planTitle: 'Araku Highlights',
      planDescription: 'Explore the key attractions.',
      durationDays: 2,
      travellers: 2,
      stayCost: 4000,
      foodCost: 2400,
      activityCost: 2000,
      tripCostPerPerson: 4200,
      totalTripCost: 8400,
      travelOptions: [],
    } satisfies TripCalculationResponse);
  });
});
