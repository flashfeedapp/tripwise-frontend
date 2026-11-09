import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import {
  Destination,
  TripCalculationRequest,
  TripCalculationResponse,
  TripPlanOption,
} from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { TripComparisonComponent } from './trip-comparison.component';

describe('TripComparisonComponent', () => {
  const request: TripCalculationRequest = {
    startingCity: 'Hyderabad',
    destinationId: 2,
    planType: 'BEST_OF_DESTINATION',
    travellers: 2,
  };
  const destination: Destination = {
    id: 2,
    name: 'Araku Valley',
    state: 'Andhra Pradesh',
    category: 'NATURE_AND_HILLS',
    shortDescription: 'Scenic hill destination.',
    overview: 'Green valleys and hills.',
    history: 'A history of local communities.',
    highlights: 'Coffee Plantations, Borra Caves',
    bestSeason: 'October to March',
    travelTips: 'Start sightseeing early.',
    dos: null,
    donts: null,
    helplineNumbers: null,
    images: {
      hero: [
        {
          id: 1,
          title: 'Araku landscape',
          imageUrl: '/araku-landscape.jpg',
          displayOrder: 1,
        },
      ],
      attractions: [
        {
          id: 2,
          title: 'Borra Caves',
          imageUrl: '/borra-caves.jpg',
          displayOrder: 1,
        },
        {
          id: 3,
          title: 'Coffee Plantations',
          imageUrl: '/coffee-plantations.jpg',
          displayOrder: 2,
        },
      ],
    },
    contentJson: {
      introduction: 'Explore Araku and its scenic hills.',
      experiences: [
        { title: 'Coffee Plantation Experience', description: 'Visit the plantations.' },
        { title: 'Cave visit', description: 'Explore the caves.' },
      ],
      localFood: { name: 'Bamboo Chicken', description: 'A regional speciality.' },
      bestTimeToVisit: { months: 'October to March', weather: 'Generally pleasant' },
      whatToCarry: ['Walking shoes'],
      travelTips: ['Start early.'],
      dos: ['Respect local communities.'],
      donts: ['Avoid littering.'],
      faqs: [{ question: 'How long to stay?', answer: 'Two to three days.' }],
    },
  };
  const selectedPlan: TripPlanOption = {
    id: 2,
    destinationId: 2,
    planType: 'BEST_OF_DESTINATION',
    title: 'Araku Highlights',
    description: 'Visit the key attractions.',
    durationDays: 2,
    estimatedStayCost: 4000,
    estimatedFoodCost: 2400,
    estimatedActivityCost: 2000,
    active: true,
    detailsJson: {
      overview: 'Explore the major attractions of Araku Valley.',
      itinerary: [
        {
          day: 1,
          title: 'Caves and waterfalls',
          activities: [
            {
              time: 'Morning',
              title: 'Borra Caves',
              attraction: 'Borra Caves',
              duration: '3 hours',
              description: 'Explore the limestone caves.',
            },
          ],
        },
      ],
      inclusions: ['Suggested sightseeing itinerary'],
      exclusions: ['Intercity transportation'],
      notes: ['Confirm local accessibility.'],
    },
  };
  let fixture: ComponentFixture<TripComparisonComponent>;
  let api: jasmine.SpyObj<TripWiseApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<TripWiseApiService>('TripWiseApiService', [
      'calculateTrip',
      'getDestination',
      'getPlans',
    ]);
    api.getDestination.and.returnValue(of(destination));
    api.getPlans.and.returnValue(of([selectedPlan]));
    await TestBed.configureTestingModule({
      imports: [TripComparisonComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(
              convertToParamMap({
                startingCity: request.startingCity,
                destinationId: String(request.destinationId),
                planType: request.planType,
                travellers: String(request.travellers),
              }),
            ),
          },
        },
        { provide: TripWiseApiService, useValue: api },
      ],
    }).compileComponents();
  });

  function calculationResponse(
    travelOptions: TripCalculationResponse['travelOptions'],
  ): TripCalculationResponse {
    return {
      startingCity: request.startingCity,
      destinationName: 'Araku Valley',
      planType: request.planType,
      planTitle: 'Araku Highlights',
      planDescription: 'Visit the key attractions.',
      durationDays: 2,
      travellers: request.travellers,
      stayCost: 4000,
      foodCost: 2400,
      activityCost: 2000,
      tripCostPerPerson: 4200,
      totalTripCost: 8400,
      travelOptions,
    };
  }

  it('does not present a plan-only total as a complete trip estimate when fares are zero', () => {
    api.calculateTrip.and.returnValue(
      of(
        calculationResponse([
          {
            transportMode: 'BUS',
            estimatedCostPerPerson: 0,
            totalTravelCost: 0,
            estimatedDuration: '10-12 hours one way',
            totalEstimatedCost: 8400,
          },
        ]),
      ),
    );
    fixture = TestBed.createComponent(TripComparisonComponent);
    fixture.detectChanges();

    fixture.nativeElement.querySelector('#transport-tab').click();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('no positive fare estimates');
    expect(fixture.nativeElement.querySelector('.transport-option-price strong').textContent)
      .toContain('Estimate unavailable');

    fixture.nativeElement.querySelector('#budget-tab').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('₹8,400');
    expect(fixture.nativeElement.textContent).toContain('Complete trip estimate unavailable');
  });

  it('shows API-returned per-person, group, and complete trip transport estimates', () => {
    api.calculateTrip.and.returnValue(
      of(
        calculationResponse([
          {
            transportMode: 'BUS',
            estimatedCostPerPerson: 1200,
            totalTravelCost: 2400,
            estimatedDuration: '10-12 hours one way',
            totalEstimatedCost: 10800,
          },
        ]),
      ),
    );
    fixture = TestBed.createComponent(TripComparisonComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#transport-tab').click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('₹1,200');
    expect(text).toContain('₹2,400');
    expect(text).toContain('₹10,800');
    expect(text).toContain('10-12 hours one way');
  });

  it('renders five tabs and uses selected-plan itinerary and destination guide data', () => {
    api.calculateTrip.and.returnValue(of(calculationResponse([])));
    fixture = TestBed.createComponent(TripComparisonComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('[role="tab"]').length).toBe(5);
    expect(fixture.nativeElement.querySelector('.trip-titlebar h1').textContent).toContain(
      'Araku Valley',
    );
    expect(fixture.nativeElement.querySelector('.destination-page-background-image').getAttribute('src'))
      .toBe('/araku-landscape.jpg');
    expect(fixture.nativeElement.textContent).toContain('Destination highlights');
    const experienceImages = fixture.nativeElement.querySelectorAll(
      '.experience-card .trip-card-photo img',
    ) as NodeListOf<HTMLImageElement>;
    expect(experienceImages[0].getAttribute('src')).toBe('/coffee-plantations.jpg');

    fixture.nativeElement.querySelector('#itinerary-tab').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Caves and waterfalls');
    expect(fixture.nativeElement.textContent).toContain('Explore the limestone caves.');
    const itineraryImage = fixture.nativeElement.querySelector('.itinerary-photo img') as HTMLImageElement;
    expect(itineraryImage.getAttribute('src')).toBe('/borra-caves.jpg');

    fixture.nativeElement.querySelector('#guide-tab').click();
    fixture.detectChanges();
    const guideText = fixture.nativeElement.textContent as string;
    expect(guideText).toContain('Explore Araku and its scenic hills.');
    expect(guideText).toContain('Walking shoes');
    expect(guideText).toContain('Bamboo Chicken');
    expect(guideText).toContain('Respect local communities.');
    expect(guideText).toContain('How long to stay?');
  });

  it('shows a returned per-person fare even when the group fare is unavailable', () => {
    api.calculateTrip.and.returnValue(
      of(
        calculationResponse([
          {
            transportMode: 'TRAIN',
            estimatedCostPerPerson: 900,
            totalTravelCost: 0,
            estimatedDuration: '',
            totalEstimatedCost: 0,
          },
        ]),
      ),
    );
    fixture = TestBed.createComponent(TripComparisonComponent);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('#transport-tab').click();
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('₹900');
    expect(text).toContain('Estimate unavailable');
    expect(text).toContain('Journey duration');
  });

  it('keeps the destination backdrop visible when a refreshed calculation fails', () => {
    api.calculateTrip.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })),
    );
    fixture = TestBed.createComponent(TripComparisonComponent);
    fixture.detectChanges();

    const backdrop = fixture.nativeElement.querySelector(
      '.destination-page-background-image',
    ) as HTMLImageElement;
    expect(fixture.nativeElement.querySelector('.error-state')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.trip-flow-shell.immersive-flow')).not.toBeNull();
    expect(backdrop.getAttribute('src')).toBe('/araku-landscape.jpg');
  });
});
