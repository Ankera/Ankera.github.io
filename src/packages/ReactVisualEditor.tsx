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

  // const { config, value, onChange } = props;

  const containerRef = useRef(null as null | HTMLDivElement);

  const containerStyles: CSSProperties = useMemo(() => {
    return {
      width: `${props.value.container.width}px`,
      height: `${props.value.container.height}px`,
    }
  }, [props.value.container.width, props.value.container.height]);

  /**
   * 菜单的拖拽事件
   */
  const menuDraggier = (() => {
    const dragData = useRef({
      dragComponent: null as null | VisualEditorComponent
    })

    const block = {
      dargStart: useCallbackRef((e: React.DragEvent<HTMLDivElement>, dragComponent: VisualEditorComponent) => {
        containerRef.current?.addEventListener('dragenter', container.dargEnter);
        containerRef.current?.addEventListener('dragover', container.dargOver);
        containerRef.current?.addEventListener('dragleave', container.dargLeave);
        containerRef.current?.addEventListener('drop', container.drop);

        dragData.current.dragComponent = dragComponent;
      }),
      dragEnd: useCallbackRef((e: React.DragEvent<HTMLDivElement>) => {
        containerRef.current?.removeEventListener('dragenter', container.dargEnter);
        containerRef.current?.removeEventListener('dragover', container.dargOver);
        containerRef.current?.removeEventListener('dragleave', container.dargLeave);
        containerRef.current?.removeEventListener('drop', container.drop);
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
        props.onChange({
          ...props.value,
          blocks: [
            ...props.value.blocks,
            createNewBlock({
              top: e.offsetY,
              left: e.offsetX,
              component: dragData.current.dragComponent!
            })
          ]
        })
      }),
    }

    return block;
  })();

  /**
   * 计算当前bloks元素，那些是选中的，那些是未选中的
   */
  const focusData = useMemo(() => {
    const focus: VisualEditorBlock[] = [];
    const unfocus: VisualEditorBlock[] = [];
    props.value.blocks.forEach((block: VisualEditorBlock) => {
      (block.focus ? focus : unfocus).push(block);
    });
    return {
      focus,
      unfocus
    }
  }, [props.value.blocks])

  /**
   * 对外暴露的方法
   */
  const methods = {
    /***
     * 更新 block
     */
    updateBlocks: (blocks: VisualEditorBlock[]) => {
      props.onChange({
        ...props.value,
        blocks: [...blocks]
      });
    },
    /**
     * 清除选中的元素
     * @param external 
     */
    clearFocus: (external?: VisualEditorBlock) => {
      (!!external ? focusData.focus.filter((item: VisualEditorBlock) => item !== external) : focusData.focus).forEach((block: VisualEditorBlock) => {
        block.focus = false;
      });
      methods.updateBlocks(props.value.blocks);
    }
  }

  /**
   * 处理block选中的事件
   */
  const focusHandler = (() => {
    const mouseDownBlock = (e: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlock) => {
      console.log('mouseDown block');
      if (e.shiftKey) {
        if (focusData.focus.length <= 1) {
          block.focus = true;
        } else {
          block.focus = !block.focus;
        }
        methods.updateBlocks(props.value.blocks);
      } else {
        /*如果点击的这个block没有被选中，才清空这个其他选中的block，否则不做任何事情。放置拖拽多个block，取消其他block的选中状态*/
        if (!block.focus) {
          block.focus = true;
          methods.clearFocus(block);
        }
      }
    }

    const mouseDownContainer = (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target !== e.currentTarget) {
        return;
      }
      if (!e.shiftKey) {
        methods.clearFocus();
      }
      console.log('mouseDown container')
    }

    return {
      block: mouseDownBlock,
      contaienr: mouseDownContainer
    }
  })();

  return (
    <div className="react-visual-editor">
      <div className="react-visual-editor-menu">
        {
          props.config.componentList.map((component: VisualEditorComponent, index: number) => (
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
          onMouseDown={focusHandler.contaienr}
          className="react-visual-editor-container">
          {
            props.value.blocks.map((block: VisualEditorBlock, index: number) => (
              <ReactVisualBlock
                key={index}
                block={block}
                config={props.config}
                onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => focusHandler.block(e, block)}
              />
            ))
          }
        </div>
      </div>
    </div>
  )
}

export default ReactVisualEditor;