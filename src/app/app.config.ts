import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { provideStore } from '@ngxs/store';
import { routes } from './app.routes';
import { apiErrorInterceptor } from './core/interceptors/api-error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiErrorInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: false,
        },
      },
      license:
        'eyJpZCI6IjczYTRiNDExLWY3ODktNDAzNC1iMGMyLTJkYjNhOWM5NzM0ZSIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODg0Nzk5MDMsImV4cCI6MTgyMDAxNTkwM30.5unb3_0FNO2zUTJIykJQZw40NqsLnn3W-0Mmv_mY9XzIhBFWAecPOJSAYyoKf7zeL8EPlD_eg3oPE6rI3h4dCQ',
    }),
    provideStore([]),
  ],
};
