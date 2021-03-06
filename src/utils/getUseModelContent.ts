import { join } from 'path';

export default function() {
  return `import { useState, useEffect, useContext, useRef } from 'react';
import isEqual from '${require.resolve('lodash.isequal')}';
import { UmiContext } from '${join(__dirname, '..', 'helpers', 'constant')}';
import { Model } from './provider';

const USEMODELINIT = Symbol('useModelInit');

export function useModel<T extends keyof Model<T>>(model: T): Model<T>[T]
export function useModel<T extends keyof Model<T>, U>(model: T, selector: (model: Model<T>[T]) => U): U

export function useModel<T extends keyof Model<T>, U>(
  namespace: T, 
  updater?: (model: Model<T>[T]) => U
) : typeof updater extends undefined ? Model<T>[T] : ReturnType<NonNullable<typeof updater>>{

  type RetState = typeof updater extends undefined ? Model<T>[T] : ReturnType<NonNullable<typeof updater>>
  const dispatcher = useContext<any>(UmiContext);
  const updaterRef = useRef(updater);
  updaterRef.current = updater;
  const [state, setState] = useState<RetState>(
    () => updaterRef.current ? updaterRef.current(dispatcher.data![namespace]) : dispatcher.data![namespace]
  );

  const lastState = useRef<any>(USEMODELINIT);

  useEffect(() => {
    const handler = (e: any) => {
      if(updater && updaterRef.current){
        const ret = updaterRef.current(e);
        const realState = lastState.current === USEMODELINIT ? state : lastState.current;
        if(!isEqual(ret, realState)){
          lastState.current = ret;
          setState(ret);
        }
      } else {
        setState(e);
      }
    }
    try {
      dispatcher.callbacks![namespace]!.add(handler);
    } catch (e) {
      dispatcher.callbacks![namespace] = new Set();
      dispatcher.callbacks![namespace]!.add(handler);
    }
    return () => {
      dispatcher.callbacks![namespace]!.delete(handler);
    }
  }, [namespace]);

  return state;
};
`;
}
