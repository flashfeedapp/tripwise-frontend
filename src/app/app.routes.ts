import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/trip-planner/trip-planner.component').then(
        (component) => component.TripPlannerComponent,
      ),
    title: 'TripWise India — Discover destinations',
  },
  {
    path: 'destinations/:id/plans',
    loadComponent: () =>
      import('./components/trip-selection/trip-selection.component').then(
        (component) => component.TripSelectionComponent,
      ),
    title: 'Choose your trip plan',
  },
  {
    path: 'destinations/:id',
    loadComponent: () =>
      import('./components/destination-page/destination-page.component').then(
        (component) => component.DestinationPageComponent,
      ),
    title: 'Destination overview',
  },
  {
    path: 'trips/compare',
    loadComponent: () =>
      import('./components/trip-comparison/trip-comparison.component').then(
        (component) => component.TripComparisonComponent,
      ),
    title: 'Compare trip costs',
  },
  { path: '**', redirectTo: '' },
];
