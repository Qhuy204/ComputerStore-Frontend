import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import AppConfig from '../../../layout/AppConfig';
import { Button } from 'primereact/button';

const ErrorPage = () => {
    const router = useRouter();
    // Add client-side rendering control
    const [isClient, setIsClient] = useState(false);

    // Set isClient to true when component mounts on client
    useEffect(() => {
        setIsClient(true);
    }, []);

    return (
        <div className="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
            <div className="flex flex-column align-items-center justify-content-center">
                <img src="/img_data/index/favicon.png" alt="GEARVN" className="mb-5 w-6rem flex-shrink-0" />
                <div style={{ borderRadius: '56px', padding: '0.3rem', background: 'linear-gradient(180deg, rgba(233, 30, 99, 0.4) 10%, rgba(33, 150, 243, 0) 30%)' }}>
                    <div className="w-full surface-card py-8 px-5 sm:px-8 flex flex-column align-items-center" style={{ borderRadius: '53px' }}>
                        <div className="flex justify-content-center align-items-center bg-pink-500 border-circle" style={{ height: '3.2rem', width: '3.2rem' }}>
                            <i className="pi pi-fw pi-exclamation-circle text-2xl text-white"></i>
                        </div>
                        <h1 className="text-900 font-bold text-5xl mb-2">Error Occured</h1>
                        <div className="text-600 mb-5">Something went wrong.</div>
                        
                        {isClient ? (
                            <Button 
                                icon="pi pi-arrow-left" 
                                label="Go to Dashboard" 
                                text 
                                onClick={() => router.push('/')} 
                            />
                        ) : (
                            <button 
                                className="p-button p-component p-button-text"
                                onClick={() => router.push('/')}
                            >
                                <i className="pi pi-arrow-left"></i>
                                <span>Go to Dashboard</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

ErrorPage.getLayout = function getLayout(page) {
    return (
        <React.Fragment>
            {page}
            <AppConfig />
        </React.Fragment>
    );
};

export default ErrorPage;