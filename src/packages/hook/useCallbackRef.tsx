import { useRef, useState } from "react";

export function useCallbackRef<Cb extends (...args: any[]) => void>(cb: Cb): Cb {
  const refCb = useRef(cb);
  refCb.current = cb;
  const [staticCb] = useState(() => {
    return ((...args: any) => refCb.current(...args)) as Cb;
  })
  return staticCb;
}