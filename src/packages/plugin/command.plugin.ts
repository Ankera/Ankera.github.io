import { useState, useCallback, useRef, useEffect } from 'react';
import { KeyboardCode } from './keyboard-code';

export interface CommandExecute {
  undo?: () => void,                                        // 撤销
  redo: () => void,                                         // 重做
}

/**
  // const commands = {
  //   delete: () => { },
  //   redo: () => { },
  //   undo: () => { },
  //   clear: () => { },
  //   placeTop: () => { },
  //   placeBottom: () => { },
  // }
 */

export interface Command {
  name: string,                                               // 命令唯一标识
  keyboard?: string | string[],                               // 命令监听的快捷键
  execute: (...args: any[]) => CommandExecute,                // 命令被执行的时候，所做的内容
  followQueue?: boolean,                                      // 命令执行完之后，是否需要将命令执行得到的undo，redo存入命令队列
  init?: () => ((() => void) | undefined),                    // 命令初始化函数
  data?: any,                                                 // 命令缓存所需要的数据
}

export function useCommander() {
  const [state] = useState(() => ({
    current: -1,                                              // 当前命令队列中，最后执行命令返回的 CommandExecute 对象
    queue: [] as CommandExecute[],                            // 命令队列
    commandArray: [] as { current: Command }[],               // 预定义命令数组
    commands: {} as Record<string, (...args: any[]) => void>, // 
    destroyList: [] as ((() => void) | undefined)[],          // 所有命令在组件销毁之前，需要执行的清除副作用的函数
  }));

  /**
   * 注册一个命令
   */
  const useRegister = useCallback((command: Command) => {
    const commandRef = useRef(command);
    commandRef.current = command;
    useState(() => {
      if (state.commands[command.name]) {
        const existIndex = state.commandArray.findIndex((item) => item.current.name === command.name);
        state.commandArray.splice(existIndex, 1);
      }

      state.commandArray.push(commandRef);
      state.commands[command.name] = (...args: any[]) => {
        const { redo, undo } = commandRef.current.execute(...args);

        redo();

        // 如果命令执行结束之后，不需要进入队列，则直接结束
        // 比如，全选命令，不需要进入队列
        if (commandRef.current.followQueue === false) {
          return;
        }

        let { queue, current } = state;
        if (queue.length > 0) {
          queue = queue.splice(0, current + 1);
          state.queue = queue;
        }
        queue.push({ redo, undo });

        // 索引加1，指向队列中的最后一个指令
        state.current = current + 1;
      }

      //@ts-ignore
    }, []);
  }, []);

  const [keyboardEvent] = useState(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement !== document.body) {
        return;
      }

      const { keyCode, shiftKey, altKey, ctrlKey, metaKey } = e;
      let keyString: string[] = [];
      if (ctrlKey || metaKey) {
        keyString.push('ctrl');
      }
      if (shiftKey) {
        keyString.push('shift');
      }
      if (ctrlKey) {
        keyString.push('ctrl');
      }
      if (altKey) {
        keyString.push('alt');
      }
      keyString.push(KeyboardCode[keyCode]);

      const keyNames = keyString.join('+');

      state.commandArray.forEach(({ current: { keyboard, name } }) => {
        if (!keyCode) {
          return;
        }
        const keys = Array.isArray(keyboard) ? keyboard : [keyboard];
        if (keys.indexOf(keyNames) >= 0) {
          state.commands[name]();
          e.stopPropagation();
          e.preventDefault();
        }
      })
    }

    const init = () => {
      document.addEventListener('keydown', onKeyDown, false);
      return () => {
        document.removeEventListener('keydown', onKeyDown);
      }
    }

    return { init };

    //@ts-ignore
  })

  const useInit = useCallback(() => {
    useState(() => {
      state.commandArray.forEach(command => !!command.current.init && state.destroyList.push(command.current.init()))
      state.destroyList.push(keyboardEvent.init())
    });

    useRegister({
      name: 'undo',
      keyboard: 'ctrl+z',
      followQueue: false,
      execute: () => {
        return {
          redo: () => {
            if (state.current === -1) {
              return
            }
            const queueItem = state.queue[state.current];
            if (!!queueItem) {
              !!queueItem.undo && queueItem.undo()
              state.current--;
            }
          },
        }
      }
    })

    useRegister({
      name: 'redo',
      keyboard: [
        'ctrl+y',
        'ctrl+shift+z',
      ],
      followQueue: false,
      execute: () => {
        return {
          redo: () => {
            const queueItem = state.queue[state.current + 1];
            if (!!queueItem) {
              queueItem.redo()
              state.current++
            }
          },
        }
      },
    })

  }, []);

  useEffect(() => {
    return () => {
      state.destroyList.forEach(fn => !!fn && fn())
    }
  }, [])

  return {
    state,
    useRegister,
    useInit
  }
}