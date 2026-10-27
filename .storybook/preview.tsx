import React from 'react';
import type {Preview} from '@storybook/react-vite';
import {KitProvider} from '../packages/react/src/KitComponent';
import '../packages/react/src/styles.css';
const preview: Preview = {
  globalTypes: {theme: {description: 'Appearance', toolbar: {icon: 'circlehollow', items: ['light', 'dark']}}},
  initialGlobals: {theme: 'light'},
  parameters: {layout: 'centered', chromatic: {pauseAnimationAtEnd: true}},
  decorators: [(Story, context) => {
    const theme = context.globals.theme === 'dark' ? 'dark' : 'light';
    return <KitProvider theme={theme}><div style={{padding:32, background:theme==='dark'?'#171719':'#f2f2f7',color:theme==='dark'?'white':'#111',borderRadius:16}}><Story/></div></KitProvider>;
  }],
};
export default preview;
