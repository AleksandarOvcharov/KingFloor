import {LoadingScreen} from '@workspace/ui/ui/global-loading'

export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <LoadingScreen message="Loading page..." spinnerSize={40} />
        </div>
    )
}
