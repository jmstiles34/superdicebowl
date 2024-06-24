export type EventHandler<T extends Event = Event> = (event: T) => void;

/** Remove the handler after the first time it runs */
export function once<T extends Event, U extends HTMLElement>(
	handler: EventHandler<T>
): EventHandler<T> {
	let hasBeenCalled = false;

	return function (this: U, event: T): void {
		if (hasBeenCalled) {
			return;
		}

		handler.call(this, event);
		hasBeenCalled = true;
	};
}

/** Calls `event.preventDefault()` before running the handler */
export function preventDefault<T extends Event, U extends HTMLElement>(
	handler: EventHandler<T>
): EventHandler<T> {
	return function (this: U, event: T) {
		event.preventDefault();
		handler.call(this, event);
	};
}

/** Only triggers handler if the `event.target` is the element itself */
export function self<T extends Event, U extends HTMLElement>(
	handler: EventHandler<T>
): EventHandler<T> {
	return function (this: U, event: T): void {
		if (event.target !== event.currentTarget) {
			return;
		}
		handler.call(this, event);
	};
}

/** Calls `event.stopImmediatePropagation()`, preventing other listeners of the same event from being fired. */
export function stopImmediatePropagation<T extends Event, U extends HTMLElement>(
	handler: EventHandler<T>
): EventHandler<T> {
	return function (this: U, event: T): void {
		event.stopImmediatePropagation();
		handler.call(this, event);
	};
}

/** Calls `event.stopPropagation()`, preventing the event reaching the next element */
export function stopPropagation<T extends Event, U extends HTMLElement>(
	handler: EventHandler<T>
): EventHandler<T> {
	return function (this: U, event: T): void {
		event.stopPropagation();
		handler.call(this, event);
	};
}
