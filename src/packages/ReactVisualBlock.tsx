import { FC, CSSProperties, useMemo } from 'react';
import { VisualEditorBlock, VisualEditorOption } from './ReactVisualEditor.utils'

export const ReactVisualBlock: FC<{
  block: VisualEditorBlock;
  config: VisualEditorOption
}> = (props) => {
  const { block, config } = props;
  const { componentMap } = config;

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

  return (
    <div
      style={stlyes}
      className="react-visual-editor-block">
      {render}
    </div>
  )
}