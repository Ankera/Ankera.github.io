import { useRef } from 'react';
import { useCallbackRef } from './hook/useCallbackRef';
import { useCommander } from './plugin/command.plugin';
import { VisualEditorBlock, VisualEditorValue } from './ReactVisualEditor.utils';
import deepcopy from 'deepcopy';

export function useVisualCommand(
  {
    focusData,
    value,
    updateBlocks,
    dragstart,
    dragend
  }: {
    focusData: {
      focus: VisualEditorBlock[];
      unfocus: VisualEditorBlock[];
    },
    value: VisualEditorValue,
    updateBlocks: (blocks: VisualEditorBlock[]) => void;
    dragstart: { on: (cb: () => void) => void, off: (cb: () => void) => void };
    dragend: { on: (cb: () => void) => void, off: (cb: () => void) => void };
  }
) {

  const commander = useCommander();

  /**
   * 删除命令
   */
  commander.useRegister({
    name: 'delete',
    keyboard: [
      'delete',
      'ctrl+d',
      'backspace',
    ],
    execute() {
      const before = deepcopy(value.blocks);
      const after = deepcopy(focusData.unfocus);

      return {
        redo: () => {
          updateBlocks(deepcopy(after));
        },
        undo: () => {
          updateBlocks(deepcopy(before));
        }
      }
    }
  });

  /**
     * 拖拽命令
     * @author  韦胜健
     * @date    2021/2/16 10:24
     */
  (() => {
    const dragData = useRef({ before: null as null | VisualEditorBlock[] })
    const handler = {
      dragstart: useCallbackRef(() => dragData.current.before = deepcopy(value.blocks)),
      dragend: useCallbackRef(() => commander.state.commands.drag()),
    }
    /**
     * 拖拽命令，适用于三种情况：
     * - 从菜单拖拽组件到容器画布；
     * - 在容器中拖拽组件调整位置
     * - 拖拽调整组件的宽度和高度；
     * @author  韦胜健
     * @date    2021/1/22 11:38 下午
     */
    commander.useRegister({
      name: 'drag',
      init() {
        dragData.current = { before: null }
        dragstart.on(handler.dragstart)
        dragend.on(handler.dragend)
        return () => {
          dragstart.off(handler.dragstart)
          dragend.off(handler.dragend)
        }
      },
      execute() {
        let before = deepcopy(dragData.current.before!)
        let after = deepcopy(value.blocks)
        return {
          redo: () => {
            updateBlocks(deepcopy(after))
          },
          undo: () => {
            updateBlocks(deepcopy(before))
          },
        }
      }
    })
  })();

  /**
   * 全选
   */
  commander.useRegister({
    name: 'selectAll',
    followQueue: false,
    keyboard: 'ctrl+a',
    execute: () => {
      return {
        redo: () => {
          (value.blocks || []).forEach(block => block.focus = true);
          updateBlocks(value.blocks)
        },
      }
    },
  })

  commander.useInit();

  return {
    delete: () => commander.state.commands.delete(),
    redo: () => commander.state.commands.redo(),
    undo: () => commander.state.commands.undo()
  }
}