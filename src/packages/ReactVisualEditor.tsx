import { FC, useMemo, CSSProperties, useRef } from 'react';
import { useCallbackRef } from './hook/useCallbackRef';
import {
  VisualEditorValue,
  VisualEditorOption,
  VisualEditorComponent,
  VisualEditorBlock,
  createNewBlock
} from './ReactVisualEditor.utils';
import { ReactVisualBlock } from './ReactVisualBlock';
import './ReactVisualEditor.scss';

const ReactVisualEditor: FC<{
  config: VisualEditorOption;
  value: VisualEditorValue;
  onChange: (value: VisualEditorValue) => void;
}> = (props) => {

  const { config, value, onChange } = props;

  const containerRef = useRef({} as HTMLDivElement);

  const containerStyles: CSSProperties = useMemo(() => {
    return {
      width: `${props.value.container.width}px`,
      height: `${props.value.container.height}px`,
    }
  }, [value.container.width, value.container.height]);

  /**
   * 菜单的拖拽事件
   */
  const menuDraggier = (() => {
    const dragData = useRef({
      dragComponent: null as null | VisualEditorComponent
    })

    const block = {
      dargStart: useCallbackRef((e: React.DragEvent<HTMLDivElement>, dragComponent: VisualEditorComponent) => {
        containerRef.current.addEventListener('dragenter', container.dargEnter);
        containerRef.current.addEventListener('dragover', container.dargOver);
        containerRef.current.addEventListener('dragleave', container.dargLeave);
        containerRef.current.addEventListener('drop', container.drop);

        dragData.current.dragComponent = dragComponent;
      }),
      dragEnd: useCallbackRef((e: React.DragEvent<HTMLDivElement>) => {
        containerRef.current.removeEventListener('dragenter', container.dargEnter);
        containerRef.current.removeEventListener('dragover', container.dargOver);
        containerRef.current.removeEventListener('dragleave', container.dargLeave);
        containerRef.current.removeEventListener('drop', container.drop);
      })
    };

    const container = {
      dargEnter: useCallbackRef((e: DragEvent) => {
        console.log('进入')
        e.dataTransfer!.dropEffect = 'move';
      }),
      dargOver: useCallbackRef((e: DragEvent) => {
        e.preventDefault();
      }),
      dargLeave: useCallbackRef((e: DragEvent) => {
        console.log('离开')
        e.dataTransfer!.dropEffect = 'none';
      }),
      drop: useCallbackRef((e: DragEvent) => {
        onChange({
          ...value,
          blocks: [
            ...value.blocks,
            createNewBlock({
              top: e.offsetY,
              left: e.offsetX,
              component: dragData.current.dragComponent!
            })
          ]
        })
      }),
    }

    return block
  })();

  return (
    <div className="react-visual-editor">
      <div className="react-visual-editor-menu">
        {
          config.componentList.map((component: VisualEditorComponent, index: number) => (
            <div
              className="react-visual-editor-menu-component"
              draggable
              onDragStart={(e: React.DragEvent<HTMLDivElement>): void => menuDraggier.dargStart(e, component)}
              onDragEnd={menuDraggier.dragEnd}
              key={index}>
              {component.preview()}
              <div className="react-visual-editor-menu-component-name">
                {component.name}
              </div>
            </div>
          ))
        }
      </div>

      <div className="react-visual-editor-head">head</div>

      <div className="react-visual-editor-operator">operator</div>

      <div className="react-visual-editor-body">
        <div
          ref={containerRef}
          style={containerStyles}
          className="react-visual-editor-container">
          {
            value.blocks.map((component: VisualEditorBlock, index: number) => (
              <ReactVisualBlock
                key={index}
                block={component}
                config={config}
              />
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default ReactVisualEditor;