import type { Dictionary } from './dict';

export const nb: Dictionary = {
  nav: {
    home: 'Hjem',
    creators: 'Skapere',
    events: 'Kamper',
    feed: 'Feed',
    community: 'Fellesskap',
    notifications: 'Varsler',
    saved: 'Lagret',
    settings: 'Innstillinger',
    signIn: 'Logg inn',
    signOut: 'Logg ut',
  },
  actions: {
    save: 'Lagre',
    cancel: 'Avbryt',
    confirm: 'Bekreft',
    delete: 'Slett',
    edit: 'Rediger',
    follow: 'Følg',
    following: 'Følger',
    subscribe: 'Abonner',
    unsubscribe: 'Avbryt abonnement',
    share: 'Del',
  },
  notify: {
    pickPublished: 'Nytt tips',
    pickGraded: 'Tips evaluert',
    lineMoved: 'Oddsen flyttet seg',
    creatorLive: 'Skaperen sender live',
    watchlistHit: 'Treff i overvåkningsliste',
  },
  state: {
    loading: 'Laster…',
    empty: 'Ingenting her ennå.',
    error: 'Noe gikk galt.',
    networkError: 'Nettverksfeil — prøv igjen.',
    unauthorized: 'Logg inn for å fortsette.',
  },
};
