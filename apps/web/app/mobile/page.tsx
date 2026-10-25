import {Suspense} from 'react'
import {MobileAuthBridge} from './mobile-auth-bridge'

// useSearchParams() in MobileAuthBridge needs a Suspense boundary, or a
// static production build fails with "Missing Suspense boundary".
export default function MobileAuthBridgePage() {
    return (
        <Suspense fallback={null}>
            <MobileAuthBridge/>
        </Suspense>
    )
}
