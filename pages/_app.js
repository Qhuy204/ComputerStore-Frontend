import React from 'react';
import { LayoutProvider } from '../layout/context/layoutcontext';
import Layout from '../layout/layout';
import Link from 'next/link';
import 'primereact/resources/primereact.css';
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import '../styles/layout/layout.scss';
// import '../styles/demo/Demos.scss';
// import '../styles/layout/_index.css';
import '../styles/layout/OrderCreation.css';
import '../styles/layout/laptopgaming.css';
import '../styles/layout/laptopgaming.css';
import '../styles/layout/header.css';
import '../styles/layout/style.css';
import '../styles/layout/_header.scss';
import '../styles/layout/_productdetails.scss';
import '../styles/layout/_orders.scss';
import '../styles/layout/_login.scss';
import '../styles/layout/_cart.scss';
import '../styles/layout/_sidebar.scss';
import '../styles/layout/_userprofile.scss';
import '../styles/layout/_productDetails.css';
import '../styles/layout/_productCard.css';



export default function MyApp({ Component, pageProps }) {
    if (Component.getLayout) {
        return <LayoutProvider>{Component.getLayout(<Component {...pageProps} />)}</LayoutProvider>;
    } else {
        return (
            <LayoutProvider>
                <Layout>
                    <Component {...pageProps} />
                </Layout>
            </LayoutProvider>
            
        );
    }
}
