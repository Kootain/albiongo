import { BaseEvent } from "./BaseEvent";

type EventHandler<T extends BaseEvent> = (event: T) => void;

class EventRegistry {
  private handlers = new Map<number, EventHandler<any>[]>();

  register<T extends BaseEvent>(code: number, handler: EventHandler<T>) {
    if (!this.handlers.has(code)) {
      this.handlers.set(code, []);
    }
    this.handlers.get(code)!.push(handler);
  }

  unregister<T extends BaseEvent>(code: number, handler: EventHandler<T>) {
    const handlers = this.handlers.get(code);
    if (handlers) {
      this.handlers.set(
        code,
        handlers.filter((h) => h !== handler)
      );
    }
  }

  dispatch(event: BaseEvent) {
    const handlers = this.handlers.get(event.Code);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }
}

export const eventRegistry = new EventRegistry();
