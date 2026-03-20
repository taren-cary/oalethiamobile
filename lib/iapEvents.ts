type Listener = () => void;

const listeners = new Set<Listener>();

export function emitIapUpdated() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Never allow one listener to break the others.
    }
  });
}

export function subscribeToIapUpdates(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

