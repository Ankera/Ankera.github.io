import { Button, Input } from 'antd';
import { createVisualEditorOption } from './packages/ReactVisualEditor.utils';

export const visualConfig = createVisualEditorOption();

visualConfig.registryComponent('text', {
  name: "文本",
  preview: () => <div>文本</div>,
  render: () => <div>文本</div>,
})

visualConfig.registryComponent('input', {
  name: "输入框",
  preview: () => (<Input placeholder="请输入" />),
  render: () => (<Input placeholder="请输入" />),
})

visualConfig.registryComponent('button', {
  name: "按钮",
  preview: () => (<Button type={"primary"}>预览按钮</Button>),
  render: () => (<Button type={"primary"}>预览按钮</Button>),
})