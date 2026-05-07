// Minimalny EventEmitter do komunikacji interceptor → nawigacja/logout.
// Interceptor 401 nie może bezpośrednio wywoływać router.replace — zamiast tego
// emituje zdarzenie 'auth:logout', nasłuchiwane przez root _layout.tsx.

type Listener = () => void;

class AuthEventEmitter {
  private readonly listeners = new Set<Listener>();

  on(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(_event: 'auth:logout'): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const authLogoutEmitter = new AuthEventEmitter();
