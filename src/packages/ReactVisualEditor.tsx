import { FC, useMemo, CSSProperties, useRef, useState } from 'react';
import { useCallbackRef } from './hook/useCallbackRef';
import classnames from 'classnames';
import { notification } from 'antd';
import {
  VisualEditorValue,
  VisualEditorOption,
  VisualEditorComponent,
  VisualEditorBlock,
  createNewBlock
} from './ReactVisualEditor.utils';
import { ReactVisualBlock } from './ReactVisualBlock';
import { useVisualCommand } from './ReactVisualEditor.command';
import { createEvent } from './plugin/event';
import { $$dialog } from "./utils/dialog-service";
import { $$dropdown, DropdownOption } from "./utils/dropdown-service";
import './ReactVisualEditor.scss';

const ReactVisualEditor: FC<{
  config: VisualEditorOption;
  value: VisualEditorValue;
  onChange: (value: VisualEditorValue) => void;
}> = (props) => {

  // 当前是否预览模式
  const [preview, setPreview] = useState(false);
  // 当前是否处于编辑状态
  const [editing, setEditing] = useState(false);

  const [dragstart] = useState(() => createEvent());
  const [dragend] = useState(() => createEvent())

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

        dragstart.emit();
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
        methods.updateBlocks([
          ...props.value.blocks,
          createNewBlock({
            top: e.offsetY,
            left: e.offsetX,
            component: dragData.current.dragComponent!
          })
        ]);

        setTimeout(() => {
          dragend.emit();
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
  }, [props.value.blocks]);

  const classes = useMemo(() => classnames([
    'react-visual-editor',
    {
      'react-visual-editor-preview': preview,
    }
  ]), [preview])

  /**
   * 右键
   */
  const handler = {
    onContextmenu: (e: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlock) => {
      if (preview) return
      e.preventDefault()
      e.stopPropagation()

      $$dropdown({
        reference: e.nativeEvent,
        render: () => <>
          <DropdownOption label="置顶节点" icon="icon-place-top" onClick={commander.placeTop} />
          <DropdownOption label="置底节点" icon="icon-place-bottom" onClick={commander.placeBottom} />
          <DropdownOption label="删除节点" icon="icon-delete" onClick={commander.delete} />
          <DropdownOption label="查看数据" icon="icon-browse" {...{ onClick: () => methods.showBlockData(block) }} />
          <DropdownOption label="导入节点" icon="icon-import" {...{ onClick: () => methods.importBlockData(block) }} />
        </>
      })
    }
  }

  /**
   * 对外暴露的方法
   */
  const methods = {
    /**
     * 更新所有value
     * @param value 
     */
    updateValue: (value: VisualEditorValue) => {
      props.onChange({ ...value });
    },
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
    },
    /**
     * 查看节点数据
     * @param block 
     */
    showBlockData: (block: VisualEditorBlock) => {
      $$dialog.textarea(JSON.stringify(block), { title: '节点数据', editReadonly: true })
    },
    importBlockData: async (block: VisualEditorBlock) => {
      const text = await $$dialog.textarea('', { title: '请输入节点Json字符串' });
      try {
        const data = JSON.parse(text || '');
        commander.updateBlock(data, block);
      } catch (e) {
        console.error(e)
        notification.open({ message: '解析json字符串出错' })
      }
    },
  }

  /**
   * 处理block选中的事件
   */
  const focusHandler = (() => {
    const mouseDownBlock = (e: React.MouseEvent<HTMLDivElement>, block: VisualEditorBlock) => {
      if (preview) {
        return;
      }
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

      setTimeout(() => {
        blockDraggier.mouseDown(e);
      });
    }

    const mouseDownContainer = (e: React.MouseEvent<HTMLDivElement>) => {
      if (preview) {
        return;
      }
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

  /**
   * 处理 block 在 container容器中的拖拽事件
   */
  const blockDraggier = (() => {
    const dragData = useRef({
      startX: 0,
      startY: 0,
      // 拖拽时选中的 block
      startPosArray: [] as { top: number, left: number }[],
      // 是否处于拖拽中
      dragging: false,
    });

    const mouseDown = useCallbackRef((e: React.MouseEvent<HTMLDivElement>) => {
      document.addEventListener('mousemove', mouseMove);
      document.addEventListener('mouseup', mouseUp);
      dragData.current = {
        startX: e.clientX,
        startY: e.clientY,
        startPosArray: focusData.focus.map(({ top, left }) => ({ top, left })),
        dragging: false
      }
    });

    const mouseMove = useCallbackRef((e: MouseEvent) => {
      const { startX, startY, startPosArray } = dragData.current;
      const { clientX: moveX, clientY: moveY } = e;
      const durX = moveX - startX;
      const durY = moveY - startY;

      focusData.focus.forEach((block: VisualEditorBlock, index: number) => {
        const { top, left } = startPosArray[index];
        block.top = top + durY;
        block.left = left + durX;
      });

      methods.updateBlocks(props.value.blocks);
      if (!dragData.current.dragging) {
        dragData.current.dragging = true;
        dragstart.emit();
      }
    });

    const mouseUp = useCallbackRef((e: MouseEvent) => {
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);
      if (dragData.current.dragging) {
        dragend.emit();
      }
    });

    return {
      mouseDown
    }
  })();

  /**
   * 命令管理对象
   */
  const commander = useVisualCommand({
    value: props.value,
    focusData,
    updateBlocks: methods.updateBlocks,
    updateValue: methods.updateValue,
    dragstart,
    dragend
  });

  const buttons: {
    label: string | (() => string),
    icon: string | (() => string),
    tip?: string | (() => string),
    handler: () => void,
  }[] = [
      { label: '撤销', icon: 'icon-back', handler: commander.undo, tip: 'ctrl+z' },
      { label: '重做', icon: 'icon-forward', handler: commander.redo, tip: 'ctrl+y, ctrl+shift+z' },
      {
        label: () => preview ? '编辑' : '预览',
        icon: () => preview ? 'icon-edit' : 'icon-browse',
        handler: () => {
          if (!preview) {
            methods.clearFocus()
          }
          setPreview(!preview)
        },
      },
      {
        label: '导入',
        icon: 'icon-import',
        handler: async () => {
          const text = await $$dialog.textarea('', { title: '请输入导入的JSON字符串' });
          try {
            const data = JSON.parse(text || '{}');
            commander.updateValue(data)
          } catch (e) {
            console.error(e)
            notification.open({
              message: '导入失败！',
              description: '导入的数据格式不正常，请检查！'
            })
          }
        }
      },
      {
        label: '导出',
        icon: 'icon-export',
        handler: () => $$dialog.textarea(JSON.stringify(props.value), { editReadonly: true, title: '导出的JSON数据' })
      },
      { label: '置顶', icon: 'icon-place-top', handler: commander.placeTop, tip: 'ctrl+up' },
      { label: '置底', icon: 'icon-place-bottom', handler: commander.placeBottom, tip: 'ctrl+down' },
      { label: '删除', icon: 'icon-delete', handler: commander.delete, tip: 'ctrl+d, backspace, delete' },
      { label: '清空', icon: 'icon-reset', handler: commander.clear, },
      {
        label: '关闭', icon: 'icon-close', handler: () => {
          methods.clearFocus()
          setEditing(false)
        },
      },
    ]

  return (
    <div className={classes}>
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

      <div className="react-visual-editor-head">
        {
          buttons.map((btn, index: number) => {
            const label = typeof btn.label === 'function' ? btn.label() : btn.label;
            const icon = typeof btn.icon === 'function' ? btn.icon() : btn.icon;
            return (
              <div
                className="react-visual-editor-head-button"
                onClick={btn.handler}
                key={index}>
                <i className={`iconfont ${icon}`}></i>
                <span>{label}</span>
              </div>
            )
          })
        }
      </div>

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
                onContextmenu={(e: React.MouseEvent<HTMLDivElement>) => {
                  handler.onContextmenu(e, block)
                }}
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