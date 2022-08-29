import { useState, useRef } from "react";
import { useCallbackRef } from './packages/hook/useCallbackRef';

const App = () => {
  const [pos, setPos] = useState({
    top: 0,
    left: 0,
  });

  const moveDraggier: any = (() => {
    const dragData = useRef({
      startX: 0,
      startY: 0,
      startTop: 0,
      startLeft: 0,
    });

    const mouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      document.addEventListener('mousemove', mouseMove, false);
      document.addEventListener('mouseup', mouseUp, false);

      dragData.current = {
        startTop: pos.top,
        startLeft: pos.left,
        startX: e.clientX,
        startY: e.clientY
      }
    }

    const mouseMove = useCallbackRef((e: MouseEvent) => {
      const { startX, startY, startTop, startLeft } = dragData.current;
      const durX = e.clientX - startX;
      const durY = e.clientY - startY;
      setPos({
        top: durY + startTop,
        left: durX + startLeft
      });

      // console.log(JSON.stringify(pos))
    })

    const mouseUp = useCallbackRef(() => {
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);
    })

    return {
      mouseDown
    };
  })();

  return (
    <div>
      <div
        style={{
          width: '100px',
          height: '100px',
          display: 'inline-block',
          backgroundColor: '#000000',
          cursor: 'pointer',
          position: 'relative',
          top: `${pos.top}px`,
          left: `${pos.left}px`,
        }}
        onMouseDown={moveDraggier.mouseDown}
      ></div>
    </div>
  )
}
export default App;