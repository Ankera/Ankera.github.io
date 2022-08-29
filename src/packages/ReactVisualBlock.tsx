import { FC, CSSProperties, useMemo, useRef, useEffect } from 'react';
import { VisualEditorBlock, VisualEditorOption } from './ReactVisualEditor.utils';
import { useUpdate } from './hook/useUpdate';

export const ReactVisualBlock: FC<{
  block: VisualEditorBlock;
  config: VisualEditorOption
}> = (props) => {
  const { block, config } = props;
  const { componentMap } = config;

  const forceUpdate = useUpdate();

  const stlyes: CSSProperties = useMemo(() => {
    return {
      left: `${block.left}px`,
      top: `${block.top}px`,
      // width: `${block.width}px`,
      // height: `${block.height}px`,
    }
  }, [block.left, block.top]);

  const component = componentMap[block.componentKey];
  let render: any;
  if (!!component) {
    render = component.render({} as any)
  }

  const elRef = useRef({} as HTMLDivElement);

  useEffect(() => {
    const { top, left } = block;
    const { width, height } = elRef.current!.getBoundingClientRect();
    props.block.top = top - height / 2;
    props.block.left = left - width / 2;
    props.block.adjustPosition = false;
    forceUpdate();
  }, [])

  return (
    <div
      style={stlyes}
      ref={elRef}
      className="react-visual-editor-block">
      {render}
    </div>
  )
}