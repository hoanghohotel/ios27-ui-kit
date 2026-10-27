import React, {useState} from 'react';
import type {Meta, StoryObj} from '@storybook/react-vite';
import {expect, userEvent, within} from 'storybook/test';
import {Button, Toggle, TextField, Slider, Stepper, Dialog, Menu} from '../packages/react/src/controls';

function Controls() {
  const [on,setOn]=useState(true),[count,setCount]=useState(3),[volume,setVolume]=useState(65);
  return <div style={{width:320,display:'grid',gap:20}}>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Button>Save</Button><Button appearance="tinted">Cancel</Button><Button disabled>Disabled</Button><Button destructive>Delete</Button></div>
    <Toggle label="Notifications" checked={on} onChange={setOn}/>
    <TextField label="Display name" defaultValue="Alex"/>
    <TextField label="Email" type="email" defaultValue="alex@" error="Enter a valid email address."/>
    <Stepper label="Quantity" value={count} onChange={setCount}/>
    <Slider label="Volume" value={volume} onChange={setVolume}/>
    <Menu label="More actions" items={[{label:'Reset quantity',onSelect:()=>setCount(3)},{label:'Delete',destructive:true,onSelect:()=>{}}]}/>
  </div>;
}
const meta = {title:'Native/Controls',component:Controls} satisfies Meta<typeof Controls>;
export default meta;
type Story=StoryObj<typeof meta>;
export const Light:Story={};
export const Dark:Story={globals:{theme:'dark'}};
export const Interaction:Story={play:async({canvasElement})=>{
  const canvas=within(canvasElement);
  await userEvent.click(canvas.getByRole('switch',{name:'Notifications'}));
  await expect(canvas.getByRole('switch')).toHaveAttribute('aria-checked','false');
  await userEvent.click(canvas.getByRole('button',{name:'Increase Quantity'}));
  await expect(canvas.getByText('4')).toBeVisible();
  await userEvent.clear(canvas.getByRole('textbox',{name:'Display name'}));
  await userEvent.type(canvas.getByRole('textbox',{name:'Display name'}),'Taylor');
  await expect(canvas.getByRole('textbox',{name:'Display name'})).toHaveValue('Taylor');
  await expect(canvas.getByRole('textbox',{name:'Email'})).toHaveAttribute('aria-invalid','true');
}};
function DialogExample(){const [open,setOpen]=useState(true);return <><Button onClick={()=>setOpen(true)}>Open dialog</Button><Dialog open={open} onClose={()=>setOpen(false)} title="Save changes?" actions={<Button onClick={()=>setOpen(false)}>Save</Button>}>Review your changes before saving.</Dialog></>;}
export const Alert:Story={render:()=> <DialogExample/>};
export const AlertDark:Story={...Alert,globals:{theme:'dark'}};
