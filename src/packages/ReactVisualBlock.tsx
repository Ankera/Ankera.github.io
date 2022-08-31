import { FC, CSSProperties, useMemo, useRef, useEffect } from 'react';
import classnames from 'classnames';
import { VisualEditorBlock, VisualEditorOption } from './ReactVisualEditor.utils';
import { useUpdate } from './hook/useUpdate';

export const ReactVisualBlock: FC<{
  block: VisualEditorBlock;
  config: VisualEditorOption;
  onMouseDown?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onContextmenu?: (e: React.MouseEvent<HTMLDivElement>) => void,
}> = (props) => {
  // const { block, config, onMouseDown } = props;

  const forceUpdate = useUpdate();

  const stlyes: CSSProperties = useMemo(() => {
    return {
      left: `${props.block.left}px`,
      top: `${props.block.top}px`,
      opacity: props.block.adjustPosition ? 0 : '',
      // width: `${block.width}px`,
      // height: `${block.height}px`,
      zIndex: props.block.zIndex || 0,
    }
  }, [props.block.left, props.block.top, props.block.adjustPosition, props.block.zIndex]);

  const component = props.config.componentMap[props.block.componentKey];
  let render: any;
  if (!!component) {
    render = component.render({} as any)
  }

  const elRef = useRef({} as HTMLDivElement);

  useEffect(() => {
    const { top, left } = props.block;
    const { width, height } = elRef.current!.getBoundingClientRect();
    props.block.top = top - height / 2;
    props.block.left = left - width / 2;
    props.block.adjustPosition = false;
    forceUpdate();
  }, [])

  const classNames: any = useMemo(() => classnames([
    'react-visual-editor-block',
    {
      'react-visual-editor-block-focus': props.block.focus
    }
  ]), [props.block.focus]);

  return (
    <div
      style={stlyes}
      ref={elRef}
      onMouseDown={props.onMouseDown}
      onContextMenu={props.onContextmenu}
      className={classNames}
    >
      {render}
    </div>
  )
}