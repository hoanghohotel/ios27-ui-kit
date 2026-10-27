import type {Meta,StoryObj} from '@storybook/react-vite';
import {LibraryHome} from './Library';
const meta={title:'Library/Overview',component:LibraryHome,parameters:{layout:'fullscreen',libraryBoard:true,chromatic:{disableSnapshot:true}}} satisfies Meta<typeof LibraryHome>;
export default meta;
export const Welcome:StoryObj<typeof meta>={name:'Browse collections'};
