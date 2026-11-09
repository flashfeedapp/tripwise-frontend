import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Destination } from '../../models/trip.models';
import { TripWiseApiService } from '../../services/trip-wise-api.service';
import { DestinationGuideComponent } from './destination-guide.component';

describe('DestinationGuideComponent', () => {
  let fixture: ComponentFixture<DestinationGuideComponent>;
  let api: jasmine.SpyObj<TripWiseApiService>;

  const araku: Destination = {
    id: 2,
    name: 'Araku Valley',
    state: 'Andhra Pradesh',
    category: 'NATURE_AND_HILLS',
    shortDescription: null,
    overview: null,
    history: null,
    highlights: 'Coffee Plantations, Borra Caves, Katiki Waterfalls',
    bestSeason: null,
    travelTips: null,
    dos: null,
    donts: null,
    helplineNumbers: null,
    images: {
      hero: [
        { id: 1, title: 'Araku landscape', imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', displayOrder: 1 },
        { id: 2, title: 'Coffee plantations', imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', displayOrder: 2 },
      ],
      attractions: [
        { id: 3, title: 'Coffee Plantations', imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', displayOrder: 1 },
        { id: 4, title: 'Borra Caves', imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', displayOrder: 2 },
        { id: 5, title: 'Katiki Waterfalls', imageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=', displayOrder: 3 },
      ],
    },
  };

  beforeEach(async () => {
    api = jasmine.createSpyObj<TripWiseApiService>('TripWiseApiService', ['getPlans']);
    api.getPlans.and.returnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [DestinationGuideComponent],
      providers: [
        provideRouter([]),
        { provide: TripWiseApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('rotates destination photography every five seconds and clears its timer on destroy', fakeAsync(() => {
    fixture = TestBed.createComponent(DestinationGuideComponent);
    fixture.componentRef.setInput('destination', araku);
    fixture.componentRef.setInput('showPlanCta', true);
    fixture.detectChanges();

    const activeImage = (): string | null =>
      fixture.nativeElement
        .querySelector('.hero-indicator.active')
        ?.getAttribute('aria-label') ?? null;
    const initialImage = activeImage();
    const backgroundImages = fixture.nativeElement.querySelectorAll(
      '.destination-page-background-image',
    );
    expect(fixture.nativeElement.querySelectorAll('.attraction-card').length).toBe(3);
    expect(backgroundImages.length).toBe(2);
    expect(backgroundImages[0].classList.contains('active')).toBeTrue();
    expect(fixture.nativeElement.querySelector('.destination-hero-cta')).not.toBeNull();

    tick(5000);
    fixture.detectChanges();
    expect(activeImage()).not.toBe(initialImage);
    expect(backgroundImages[0].classList.contains('active')).toBeFalse();
    expect(backgroundImages[1].classList.contains('active')).toBeTrue();

    fixture.destroy();
    expect(() => tick(10000)).not.toThrow();
  }));

  it('organises available destination content into dedicated guide sections', () => {
    fixture = TestBed.createComponent(DestinationGuideComponent);
    fixture.componentRef.setInput('destination', {
      ...araku,
      overview: 'A green highland escape.',
      contentJson: {
        historyAndCulture: {
          history: 'A region shaped by local traditions.',
          culture: 'Local communities preserve distinct customs.',
        },
        attractions: [
          { name: 'Borra Caves', description: 'Explore the limestone chambers.' },
        ],
        howToReach: {
          air: 'Visakhapatnam Airport is the nearest major airport.',
          rail: 'Scenic rail services connect the region.',
        },
        localTransport: ['Local taxis connect nearby sights.'],
        experiences: [{ title: 'Coffee trail', description: 'Walk through the plantations.' }],
        localFood: { name: 'Bamboo chicken', description: 'A regional speciality.' },
        bestTimeToVisit: { months: 'October to March', weather: 'Pleasant days.' },
        faqs: [{ question: 'How long should I stay?', answer: 'Two to three days.' }],
      },
    });
    fixture.detectChanges();

    const pageText = fixture.nativeElement.textContent as string;
    expect(pageText).toContain('History and culture');
    expect(pageText).toContain('Local communities preserve distinct customs.');
    expect(pageText).toContain('Why visit Araku Valley?');
    expect(pageText).toContain('Places worth lingering');
    expect(pageText).toContain('Explore the limestone chambers.');
    expect(pageText).toContain('Unique experiences');
    expect(pageText).toContain('Coffee trail');
    expect(pageText).toContain('Bamboo chicken');
    expect(pageText).toContain('October to March');
    expect(pageText).toContain('How to reach');
    expect(pageText).toContain('Visakhapatnam Airport');
    expect(pageText).toContain('Local transport');
    expect(pageText).toContain('Frequently asked questions');
    expect(pageText).toContain('Two to three days.');

    fixture.destroy();
  });

  it('provides seven destination tabs and shows API itinerary data without fabricating missing days', () => {
    api.getPlans.and.returnValue(
      of([
        {
          id: 21,
          destinationId: araku.id,
          planType: 'BEST_OF_DESTINATION',
          title: 'Araku Highlights',
          description: 'Explore the region.',
          durationDays: 2,
          estimatedStayCost: 2000,
          estimatedFoodCost: 1200,
          estimatedActivityCost: 1000,
          active: true,
          detailsJson: {
            itinerary: [
              {
                day: 1,
                title: 'Valley and caves',
                activities: [
                  {
                    time: 'Morning',
                    title: 'Visit Borra Caves',
                    description: 'Explore the limestone chambers.',
                  },
                ],
              },
            ],
          },
        },
      ]),
    );
    fixture = TestBed.createComponent(DestinationGuideComponent);
    fixture.componentRef.setInput('destination', araku);
    fixture.detectChanges();

    const tabs: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      '[role="tab"]',
    );
    expect(tabs.length).toBe(7);
    expect(tabs[0].textContent).toContain('Overview');

    tabs[4].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#destination-itinerary-panel').hidden).toBeFalse();
    expect(fixture.nativeElement.textContent).toContain('Visit Borra Caves');
    const daysSelect = fixture.nativeElement.querySelector(
      '.itinerary-controls label:nth-child(2) select',
    ) as HTMLSelectElement;
    daysSelect.value = '2';
    daysSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Showing 1 day(s) with available itinerary data');

    tabs[5].click();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No verified packages listed yet');

    fixture.destroy();
  });
});
