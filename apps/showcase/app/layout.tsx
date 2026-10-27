import type {Metadata} from 'next';
import '@local/ios27-react/styles.css';
import './showcase.css';
export const metadata:Metadata={title:'iOS 27 · Component Library',description:'Reusable React and Flutter components from your Figma kit.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
