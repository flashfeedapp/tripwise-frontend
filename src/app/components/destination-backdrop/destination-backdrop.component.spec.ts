import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Destination } from '../../models/trip.models';
import { DestinationBackdropComponent } from './destination-backdrop.component';

describe('DestinationBackdropComponent', () => {
  let fixture: ComponentFixture<DestinationBackdropComponent>;

  const destination: Destination = {
    id: 2,
    name: 'Araku Valley',
    state: 'Andhra Pradesh',
    category: 'NATURE_AND_HILLS',
    shortDescription: null,
    overview: null,
    history: null,
    highlights: '',
    bestSeason: null,
    travelTips: null,
    dos: null,
    donts: null,
    helplineNumbers: null,
    images: {
      hero: [
        { id: 1, title: 'Araku landscape', imageUrl: '/araku-landscape.jpg', displayOrder: 1 },
        { id: 2, title: 'Coffee plantations', imageUrl: '/araku-coffee.jpg', displayOrder: 2 },
      ],
      attractions: [],
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DestinationBackdropComponent],
    }).compileComponents();
  });

  it('rotates the selected destination photos and cleans up its timer', fakeAsync(() => {
    fixture = TestBed.createComponent(DestinationBackdropComponent);
    fixture.componentRef.setInput('destination', destination);
    fixture.detectChanges();

    const images = fixture.nativeElement.querySelectorAll(
      '.destination-page-background-image',
    ) as NodeListOf<HTMLImageElement>;
    expect(images.length).toBe(2);
    expect(images[0].getAttribute('src')).toBe('/araku-landscape.jpg');
    expect(images[0].classList.contains('active')).toBeTrue();

    tick(5000);
    fixture.detectChanges();
    expect(images[0].classList.contains('active')).toBeFalse();
    expect(images[1].classList.contains('active')).toBeTrue();

    fixture.destroy();
    expect(() => tick(10000)).not.toThrow();
  }));
});
