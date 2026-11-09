// Actualizar (VER-8): the update of the app shell to the deploy of the host. `container` is
// `navigator.serviceWorker`, a parameter so that a test passes a fake (ENG-5).

export const UPDATE_MS = 15_000;

// True when a worker other than `old` takes control within `timeout`; false when `worker` goes
// redundant (its install failed) or the time runs out.
const takesControl = (container, old, worker, timeout) =>
  new Promise((resolve) => {
    if (container.controller !== old) {
      resolve(true);
      return;
    }
    const done = (value) => {
      clearTimeout(timer);
      container.removeEventListener('controllerchange', onChange);
      worker?.removeEventListener('statechange', onState);
      resolve(value);
    };
    const onChange = () => done(true);
    const onState = () => {
      if (worker.state === 'redundant') done(false);
    };
    const timer = setTimeout(() => done(false), timeout);
    container.addEventListener('controllerchange', onChange);
    worker?.addEventListener('statechange', onState);
  });

// The answer of the worker in control to `refresh`: true when it loaded its shell again.
const refreshed = (worker, timeout) =>
  new Promise((resolve) => {
    const channel = new MessageChannel();
    const done = (value) => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(value);
    };
    const timer = setTimeout(() => done(false), timeout);
    channel.port1.onmessage = (event) => done(Boolean(event.data?.ok));
    worker.postMessage({ type: 'refresh' }, [channel.port2]);
  });

// `reload` when the page can load the new shell, `failed` when it cannot. A new `sw.js` installs
// its own worker with the file list of its own deploy; only with no new worker does the worker in
// control load its list again, as that list can name a file that a new deploy moved.
// The promise, or undefined when it does not settle within `ms`. With no server the browser can
// leave `registration.update()` pending with no end.
const within = (promise, ms) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(undefined), ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

export const updateShell = async ({ container, timeout = UPDATE_MS }) => {
  const old = container?.controller;
  if (!old) return 'reload';
  // One deadline for the whole update (VER-8: 15 seconds at most).
  const deadline = Date.now() + timeout;
  const left = () => Math.max(0, deadline - Date.now());
  let registration = null;
  try {
    registration = await within(container.getRegistration(), left());
    await within(registration?.update(), left());
  } catch {
    // No connection to the host: the refresh of the worker in control decides.
  }
  const fresh = [registration?.installing, registration?.waiting, registration?.active].find((worker) => worker && worker !== old);
  if (fresh || container.controller !== old) return (await takesControl(container, old, fresh, left())) ? 'reload' : 'failed';
  return (await refreshed(old, left())) ? 'reload' : 'failed';
};
