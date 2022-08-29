import { useState, useRef } from "react";
import { useCallbackRef } from './packages/hook/useCallbackRef';
import ReactVisualEditor from './packages/ReactVisualEditor';
import { visualConfig } from './visual.config';
import { VisualEditorValue } from './packages/ReactVisualEditor.utils';

const App = () => {

  const [editValue, setEditorValue] = useState<VisualEditorValue>({
    container: {
      width: 700,
      height: 500,
    },
    blocks: [
      {
        componentKey: 'text',
        top: 100,
        left: 100,
        width: 100,
        height: 100
      },
      {
        componentKey: 'button',
        top: 200,
        left: 200,
        width: 100,
        height: 100
      },
      {
        componentKey: 'input',
        top: 300,
        left: 300,
        width: 100,
        height: 100
      }
    ],
  })

  return (
    <div>
      <ReactVisualEditor
        config={visualConfig}
        value={editValue}
        onChange={setEditorValue}
      />
    </div>
  )
}
export default App;