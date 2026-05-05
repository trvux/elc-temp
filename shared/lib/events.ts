//func listen: payload(↓) / none(↑)
type Handler<T = unknown> = (payload: T) => void;


class EventBus {
    // attribute: listeners -> category func handler type key:value
    private listeners = new Map<string, Handler[]>();

    //method on: func register for spec event
    on<T>(event: string, handler: Handler<T>) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(handler as Handler);
        return () => this.off(event, handler);
    }

    // method off: remove func register event
    off<T>(event: string, handler: Handler<T>) {
        const handlers = this.listeners.get(event);
        if (handlers) {
            this.listeners.set(
                event,
                handlers.filter((h) => h !== handler),
            );
        }
    }

    // method emit: announced event
    emit<T>(event: string, payload: T) {
        this.listeners.get(event)?.forEach((handler) => {
            try {
                handler(payload);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }
}

// singleton instance
export const eventBus = new EventBus();
