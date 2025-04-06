import { useRef, useSyncExternalStore } from 'react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const storageMap = new Map();
export const useStorage = storage => {
  const initializedRef = useRef(false);
  const _data = useSyncExternalStore(storage.subscribe, storage.getSnapshot);
  if (!storageMap.has(storage)) {
    storageMap.set(storage, wrapPromise(storage.get()));
  }
  if (_data !== null || initializedRef.current) {
    storageMap.set(storage, { read: () => _data });
    initializedRef.current = true;
  }
  return _data ?? storageMap.get(storage).read();
};
const wrapPromise = promise => {
  let status = 'pending';
  let result;
  const suspender = promise.then(
    r => {
      status = 'success';
      result = r;
    },
    e => {
      status = 'error';
      result = e;
    },
  );
  return {
    read() {
      switch (status) {
        case 'pending':
          throw suspender;
        case 'error':
          throw result;
        default:
          return result;
      }
    },
  };
};
