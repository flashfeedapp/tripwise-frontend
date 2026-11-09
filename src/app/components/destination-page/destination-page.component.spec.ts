import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { Destination } from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { DestinationPageComponent } from './destination-page.component';

describe('DestinationPageComponent', () => {
  let fixture: ComponentFixture<DestinationPageComponent>;
  let api: jasmine.SpyObj<TripWiseApiService>;

  const destination: Destination = {
    id: 3,
    name: 'Munnar',
    state: 'Kerala',
    category: 'NATURE_AND_HILLS',
    shortDescription: 'Tea gardens and mountain air.',
    overview: 'A green hill destination.',
    history: 'A long history of tea cultivation.',
    highlights: 'Tea Museum, Eravikulam National Park',
    bestSeason: 'September to March',
    travelTips: 'Carry a light jacket.',
    dos: 'Respect local customs',
    donts: 'Do not litter',
    helplineNumbers: 'Tourism: 04865 231516',
    images: {
      hero: [
        { id: 31, title: 'Munnar Hills', imageUrl: '/munnar-hero.jpg', displayOrder: 1 },
        { id: 32, title: 'Tea Gardens', imageUrl: '/munnar-tea.jpg', displayOrder: 2 },
      ],
      attractions: [
        { id: 33, title: 'Tea Plantations', imageUrl: '/tea.jpg', displayOrder: 1 },
        { id: 34, title: 'Eravikulam National Park', imageUrl: '/park.jpg', displayOrder: 2 },
      ],
    },
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<TripWiseApiService>('TripWiseApiService', [
      'getDestination',
      'getPlans',
    ]);
    api.getPlans.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [DestinationPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ id: String(destination.id) })) },
        },
        { provide: TripWiseApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('fetches the route ID and renders destination details and all attraction photographs', () => {
    api.getDestination.and.returnValue(of(destination));
    fixture = TestBed.createComponent(DestinationPageComponent);
    fixture.detectChanges();

    expect(api.getDestination).toHaveBeenCalledOnceWith(3);
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Munnar');
    expect(text).toContain('Kerala');
    expect(text).toContain('Tea gardens and mountain air.');
    expect(text).toContain('A green hill destination.');
    expect(text).toContain('A long history of tea cultivation.');
    expect(text).toContain('Tea Museum');
    expect(text).toContain('September to March');
    expect(text).toContain('Carry a light jacket.');
    expect(text).toContain('Respect local customs');
    expect(text).toContain('Do not litter');
    expect(text).toContain('Tourism: 04865 231516');
    const backgrounds = fixture.nativeElement.querySelectorAll('.destination-page-background-image');
    expect(backgrounds.length).toBe(2);
    expect(backgrounds[0].getAttribute('src')).toBe('/munnar-hero.jpg');
    expect(backgrounds[0].classList.contains('active')).toBeTrue();
    expect(fixture.nativeElement.querySelector('.immersive-destination-hero')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.destination-hero-cta').textContent).toContain(
      'Calculate My Trip',
    );
    expect(fixture.nativeElement.querySelectorAll('.attraction-card').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.attraction-card h3').textContent).toContain(
      'Tea Plantations',
    );
  });

  it('shows a useful not-found message when the API returns another destination ID', () => {
    api.getDestination.and.returnValue(of({ ...destination, id: 5 }));
    fixture = TestBed.createComponent(DestinationPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'The requested destination could not be found.',
    );
    expect(fixture.nativeElement.querySelector('app-destination-guide')).toBeNull();
  });

  it('shows API errors instead of hiding them', () => {
    api.getDestination.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    fixture = TestBed.createComponent(DestinationPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Destination details could not be found.',
    );
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Try again');
  });
});
