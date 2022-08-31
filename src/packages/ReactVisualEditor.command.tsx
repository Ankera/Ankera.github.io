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
    updateValue,
    dragstart,
    dragend
  }: {
    focusData: {
      focus: VisualEditorBlock[];
      unfocus: VisualEditorBlock[];
    },
    value: VisualEditorValue,
    updateBlocks: (blocks: VisualEditorBlock[]) => void;
    updateValue: (value: VisualEditorValue) => void;
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

  /**
   * 置顶
   */
  commander.useRegister({
    name: 'placeTop',
    keyboard: 'ctrl+up',
    execute: () => {
      const before = deepcopy(value.blocks);
      const after = (() => {
        const { focus, unfocus } = focusData;
        const maxUnFocusIndex = unfocus.reduce((prev, item) => Math.max(prev, item.zIndex || 0), -Infinity);
        const minFocusIndex = focus.reduce((prev, item) => Math.min(prev, item.zIndex || 0), Infinity);
        let dur = maxUnFocusIndex - minFocusIndex;
        if (dur >= 0) {
          dur++;
          focus.forEach(block => {
            block.zIndex = (block.zIndex || 0) + dur;
          })
        }
        return value.blocks;
      })();
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

  /**
   * 置低
   */
  commander.useRegister({
    name: 'placeBottom',
    keyboard: 'ctrl+down',
    execute: () => {
      const before = deepcopy(value.blocks);
      const after = (() => {
        const { focus, unfocus } = focusData;
        const minUnFocusIndex = unfocus.reduce((prev, item) => Math.min(prev, item.zIndex || 0), Infinity);
        const maxFocusIndex = focus.reduce((prev, item) => Math.max(prev, item.zIndex || 0), -Infinity);
        const minFocusIndex = focus.reduce((prev, item) => Math.min(prev, item.zIndex || 0), Infinity);
        let dur = maxFocusIndex - minUnFocusIndex;
        if (dur >= 0) {
          dur++;
          focus.forEach(block => {
            block.zIndex = (block.zIndex || 0) - dur;
          });
          if (minFocusIndex - dur < 0) {
            dur = dur - minFocusIndex;
            value.blocks.forEach(block => {
              block.zIndex = (block.zIndex || 0) + dur;
            })
          }
        }
        return value.blocks;
      })();
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

  /**
   * 清空
   */
  commander.useRegister({
    name: 'clear',
    execute: () => {
      let data = {
        before: deepcopy(value.blocks),
        after: deepcopy([]),
      }
      return {
        redo: () => {
          updateBlocks(deepcopy(data.after))
        },
        undo: () => {
          updateBlocks(deepcopy(data.before))
        },
      }
    }
  });

  /**
   * 更新数据
   */
  commander.useRegister({
    name: 'updateValue',
    execute: (newValue: VisualEditorValue) => {
      let before = deepcopy(value);
      let after = deepcopy(newValue);
      return {
        redo: () => updateValue(deepcopy(after!)),
        undo: () => updateValue(deepcopy(before!)),
      }
    },
  })

  /**
   * 更新节点数据
   */
  commander.useRegister({
    name: 'updateBlock',
    execute: (newBlock: VisualEditorBlock, oldBlock: VisualEditorBlock) => {
      const before = deepcopy(value);
      const index = value.blocks!.indexOf(oldBlock);
      value.blocks.splice(index, 1, newBlock);
      const after = deepcopy(value);
      return {
        redo: () => updateValue(deepcopy(after!)),
        undo: () => updateValue(deepcopy(before!)),
      }
    },
  })

  commander.useInit();

  return {
    delete: () => commander.state.commands.delete(),
    redo: () => commander.state.commands.redo(),
    undo: () => commander.state.commands.undo(),
    placeTop: () => commander.state.commands.placeTop(),
    placeBottom: () => commander.state.commands.placeBottom(),
    clear: () => commander.state.commands.clear(),
    updateValue: (value: VisualEditorValue) => commander.state.commands.updateValue(value),
    updateBlock: (newBlock: VisualEditorBlock, oldBlock: VisualEditorBlock) => commander.state.commands.updateBlock(newBlock, oldBlock)
  }
}