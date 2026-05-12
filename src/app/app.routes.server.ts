import { RenderMode, type ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    // Dashboard: SSR for instant first paint — capabilities are fetched
    // server-side and transferred to the client via TransferState.
    path: '',
    renderMode: RenderMode.Server,
  },
  {
    // All other pages are dynamic (forms, file uploads) — render on client.
    path: '**',
    renderMode: RenderMode.Client,
  },
];
