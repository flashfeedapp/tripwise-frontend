import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Destination } from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { TripPlannerComponent } from './trip-planner.component';

describe('TripPlannerComponent', () => {
  let fixture: ComponentFixture<TripPlannerComponent>;
  let api: jasmine.SpyObj<TripWiseApiService>;

  const destinations: Destination[] = [
    destination(5, 'Jaipur', 'Rajasthan', 'HISTORY_AND_CULTURE'),
    destination(2, 'Araku Valley', 'Andhra Pradesh', 'NATURE_AND_HILLS'),
    destination(3, 'Munnar', 'Kerala', 'NATURE_AND_HILLS'),
    destination(4, 'Goa', 'Goa', 'BEACHES'),
  ];

  beforeEach(async () => {
    api = jasmine.createSpyObj<TripWiseApiService>('TripWiseApiService', ['getDestinations']);
    api.getDestinations.and.returnValue(of(destinations));
    await TestBed.configureTestingModule({
      imports: [TripPlannerComponent],
      providers: [provideRouter([]), { provide: TripWiseApiService, useValue: api }],
    }).compileComponents();
  });

  it('displays every API destination and uses its nested hero image without requiring an active flag', () => {
    fixture = TestBed.createComponent(TripPlannerComponent);
    fixture.detectChanges();

    const cards: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.dest-card');
    expect(cards.length).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('Jaipur');
    expect(fixture.nativeElement.textContent).toContain('Araku Valley');
    expect(fixture.nativeElement.textContent).toContain('Munnar');
    expect(fixture.nativeElement.textContent).toContain('Goa');
    expect((cards[0].querySelector('img') as HTMLImageElement).src).toBe(
      destinations[0].images.hero[0].imageUrl,
    );
  });

  it('renders two overlapping full-screen layers with the featured destination photos', () => {
    fixture = TestBed.createComponent(TripPlannerComponent);
    fixture.detectChanges();

    const layers: NodeListOf<HTMLElement> =
      fixture.nativeElement.querySelectorAll('.landing-background-layer');
    expect(layers.length).toBe(2);
    expect(layers[0].classList.contains('active')).toBeTrue();
    expect(layers[0].style.backgroundImage).toContain(destinations[1].images.hero[0].imageUrl);
    expect(fixture.nativeElement.querySelector('.landing-background')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.landing-hero-indicators button').length).toBe(4);

    fixture.destroy();
  });

  it('filters by category and state, and clears all filters', () => {
    fixture = TestBed.createComponent(TripPlannerComponent);
    fixture.detectChanges();

    const natureCategory = [...fixture.nativeElement.querySelectorAll('.category')].find(
      (button: HTMLButtonElement) => button.textContent?.includes('Nature & Hills'),
    ) as HTMLButtonElement;
    natureCategory.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.dest-card').length).toBe(2);

    const stateFilter = fixture.nativeElement.querySelector(
      '.destination-state-filter select',
    ) as HTMLSelectElement;
    stateFilter.value = 'Kerala';
    stateFilter.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.dest-card').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Munnar');

    (fixture.nativeElement.querySelector('.clear-filters') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.dest-card').length).toBe(4);
    expect(stateFilter.value).toBe('ALL');
  });
});

function destination(
  id: number,
  name: string,
  state: string,
  category: Destination['category'],
): Destination {
  return {
    id,
    name,
    state,
    category,
    shortDescription: `${name} destination`,
    overview: null,
    history: null,
    highlights: '',
    bestSeason: null,
    travelTips: null,
    images: {
      hero: [
        {
          id,
          title: `${name} view`,
          imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=',
          displayOrder: 1,
        },
      ],
      attractions: [],
    },
  };
}
